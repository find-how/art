import { brandConfig } from "./brand-config.js";

const encoder = new TextEncoder();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(data, init = {}) {
  return Response.json(data, {
    headers: {
      "cache-control": "public, max-age=300",
      ...init.headers
    },
    ...init
  });
}

function configuredBrand(env) {
  const origin = env.PUBLIC_ORIGIN || brandConfig.origin;
  const deployUrl = env.PIONEER_DEPLOY_URL || brandConfig.deployActions[0].href;

  return {
    ...brandConfig,
    origin,
    deployActions: brandConfig.deployActions.map((action) => {
      if (action.label === "Deploy to Pioneer") {
        return { ...action, href: deployUrl };
      }

      return action;
    })
  };
}

function streamHeaders() {
  return {
    "content-type": "application/x-ndjson; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  };
}

function encodeEvent(line, kind = "normal", status = "streaming") {
  return encoder.encode(`${JSON.stringify({ line, kind, status })}\n`);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeArtisanPayload(payload) {
  const command = typeof payload?.command === "string" ? payload.command.trim() : "";
  const args = Array.isArray(payload?.args) ? payload.args.filter((arg) => typeof arg === "string") : [];

  if (!command) {
    return null;
  }

  return {
    command,
    args,
    runId: payload?.runId || crypto.randomUUID(),
    requestedAt: new Date().toISOString()
  };
}

async function runEdgeArtisan(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return json({
      ok: true,
      endpoint: "/__artisan",
      method: "POST",
      example: {
        command: "edge:report",
        args: ["orders", "--queue"]
      }
    });
  }

  const payload = normalizeArtisanPayload(await readJson(request));

  if (!payload) {
    return json({ error: "Expected JSON body with a command string." }, { status: 400 });
  }

  if (!env.ARTISAN_SESSIONS) {
    return json({ error: "ARTISAN_SESSIONS Durable Object binding is not configured." }, { status: 500 });
  }

  const id = env.ARTISAN_SESSIONS.idFromName(`artisan:${payload.command}`);
  const session = env.ARTISAN_SESSIONS.get(id);

  return session.fetch("https://edge-artisan.local/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function assetJson(env, request, pathname) {
  const assetUrl = new URL(pathname, request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl, request));

  if (!response.ok) {
    return json({ error: "Asset JSON not found", pathname }, { status: response.status });
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "pioneer-brand-assets",
        domain: configuredBrand(env).domain,
        checkedAt: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/brand") {
      return json(configuredBrand(env));
    }

    if (url.pathname === "/api/assets") {
      return assetJson(env, request, "/assets/manifest.json");
    }

    if (url.pathname === "/__artisan" || url.pathname.startsWith("/__artisan/")) {
      return runEdgeArtisan(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

export class EdgeArtisanSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== "/run" || request.method !== "POST") {
      return json({ error: "Edge Artisan session route not found." }, { status: 404 });
    }

    const payload = normalizeArtisanPayload(await readJson(request));

    if (!payload) {
      return json({ error: "Expected JSON body with a command string." }, { status: 400 });
    }

    return new Response(this.commandStream(payload), {
      headers: streamHeaders()
    });
  }

  commandStream(payload) {
    const state = this.state;
    const env = this.env;

    return new ReadableStream({
      async start(controller) {
        const emit = async (line, kind = "normal", status = "streaming", delay = 130) => {
          controller.enqueue(encodeEvent(line, kind, status));
          await sleep(delay);
        };

        try {
          const args = payload.args.join(" ");
          const commandLine = `$ php artisan ${payload.command}${args ? ` ${args}` : ""}`;
          const runRecord = {
            id: payload.runId,
            command: payload.command,
            args: payload.args,
            requestedAt: payload.requestedAt
          };

          await emit(commandLine, "command", "booting", 120);
          await emit("Worker POST /__artisan accepted command envelope", "muted", "worker");

          await state.storage.put(`runs/${payload.runId}`, runRecord);
          await state.storage.put("last-run", runRecord);
          await emit("Durable Object claimed command session and persisted run state", "success", "session");

          const discoveryRequest = new Request(`https://edge-artisan.local/commands/${payload.command}`);
          const discoveryResponse = new Response(
            JSON.stringify({
              command: payload.command,
              driver: "DurableObject",
              primitives: ["Worker", "Durable Object", "D1", "KV", "Cache", "R2", "Queues", "Logs"]
            }),
            { headers: { "content-type": "application/json" } }
          );

          try {
            await caches.default.put(discoveryRequest, discoveryResponse);
            await emit("Cache API warmed command discovery manifest", "success", "cache");
          } catch (error) {
            await emit(`Cache API skipped: ${error.message}`, "warn", "cache");
          }

          if (env.EDGE_ARTISAN_DB?.prepare) {
            const row = await env.EDGE_ARTISAN_DB.prepare("select count(*) as total from orders").first();
            await emit(`D1 query completed: orders.total=${row?.total ?? 0}`, "success", "d1");
          } else {
            await emit("D1 adapter ready: EDGE_ARTISAN_DB not bound, using demo orders.total=42", "warn", "d1");
          }

          if (env.EDGE_ARTISAN_KV?.put) {
            await env.EDGE_ARTISAN_KV.put("artisan:last-command", payload.command);
            await emit("KV stored artisan:last-command cursor", "success", "kv");
          } else {
            await state.storage.put("kv:artisan:last-command", payload.command);
            await emit("KV adapter ready: stored cursor in Durable Object fallback", "warn", "kv");
          }

          const artifact = JSON.stringify({
            runId: payload.runId,
            command: payload.command,
            report: "orders",
            total: 42
          });

          if (env.EDGE_ARTISAN_REPORTS?.put) {
            await env.EDGE_ARTISAN_REPORTS.put("artisan/orders-report.json", artifact);
            await emit("R2 wrote artisan/orders-report.json", "success", "r2");
          } else {
            await state.storage.put("r2:artisan/orders-report.json", artifact);
            await emit("R2 adapter ready: stored report artifact in Durable Object fallback", "warn", "r2");
          }

          if (env.EDGE_ARTISAN_QUEUE?.send) {
            await env.EDGE_ARTISAN_QUEUE.send({ type: "report.ready", command: payload.command, runId: payload.runId });
            await emit("Queue dispatched report.ready background job", "success", "queue");
          } else {
            await state.storage.put(`queue:${payload.runId}`, { type: "report.ready", command: payload.command });
            await emit("Queue adapter ready: queued follow-up payload in Durable Object fallback", "warn", "queue");
          }

          console.log("edge.artisan.completed", {
            runId: payload.runId,
            command: payload.command
          });

          await emit("console.log edge.artisan.completed", "muted", "logs");
          await emit("Command finished successfully. Edge CLI output streamed from the Worker.", "success", "complete", 0);
        } catch (error) {
          controller.enqueue(encodeEvent(`Command failed: ${error.message}`, "warn", "error"));
        } finally {
          controller.close();
        }
      }
    });
  }
}
