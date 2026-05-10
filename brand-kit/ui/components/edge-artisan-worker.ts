type Env = {
  ARTISAN_SESSIONS: DurableObjectNamespace<EdgeArtisanSession>;
  EDGE_ARTISAN_DB?: D1Database;
  EDGE_ARTISAN_KV?: KVNamespace;
  EDGE_ARTISAN_REPORTS?: R2Bucket;
  EDGE_ARTISAN_QUEUE?: Queue;
};

type ArtisanPayload = {
  command: string;
  args?: string[];
  runId?: string;
};

export default {
  async fetch(request: Request, env: Env) {
    if (request.method !== "POST") {
      return Response.json({
        endpoint: "/__artisan",
        method: "POST",
        example: { command: "edge:report", args: ["orders", "--queue"] },
      });
    }

    const payload = (await request.json()) as ArtisanPayload;
    const command = payload.command.trim();
    const args = payload.args ?? [];
    const runId = payload.runId ?? crypto.randomUUID();

    const id = env.ARTISAN_SESSIONS.idFromName("artisan:" + command);
    const session = env.ARTISAN_SESSIONS.get(id);

    return session.fetch("https://edge-artisan.local/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command, args, runId }),
    });
  },
};

export class EdgeArtisanSession {
  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  async fetch(request: Request) {
    const payload = (await request.json()) as Required<ArtisanPayload>;
    const encoder = new TextEncoder();

    const emit = (line: string, kind = "normal", status = "streaming") =>
      encoder.encode(JSON.stringify({ line, kind, status }) + "\n");

    const stream = new ReadableStream({
      start: async (controller) => {
        const commandLine = "$ php artisan " + payload.command + " " + payload.args.join(" ");

        controller.enqueue(emit(commandLine, "command", "booting"));
        controller.enqueue(emit("Worker accepted /__artisan command envelope", "muted", "worker"));

        await this.state.storage.put("last-run", payload);
        await this.state.storage.put("runs/" + payload.runId, payload);
        controller.enqueue(emit("Durable Object claimed command session", "success", "session"));

        if (this.env.EDGE_ARTISAN_DB) {
          await this.env.EDGE_ARTISAN_DB
            .prepare("select count(*) as total from orders")
            .first();
          controller.enqueue(emit("D1 query completed", "success", "d1"));
        } else {
          controller.enqueue(emit("D1 adapter ready; bind EDGE_ARTISAN_DB to execute real SQL", "warn", "d1"));
        }

        await caches.default.put(
          new Request("https://edge-artisan.local/commands/" + payload.command),
          new Response(JSON.stringify({ command: payload.command }), {
            headers: { "content-type": "application/json" },
          }),
        );
        controller.enqueue(emit("Cache API warmed command discovery manifest", "success", "cache"));

        if (this.env.EDGE_ARTISAN_KV) {
          await this.env.EDGE_ARTISAN_KV.put("artisan:last-command", payload.command);
          controller.enqueue(emit("KV stored artisan:last-command cursor", "success", "kv"));
        }

        if (this.env.EDGE_ARTISAN_REPORTS) {
          await this.env.EDGE_ARTISAN_REPORTS.put(
            "artisan/orders-report.json",
            JSON.stringify({ runId: payload.runId, command: payload.command }),
          );
          controller.enqueue(emit("R2 wrote artisan/orders-report.json", "success", "r2"));
        }

        if (this.env.EDGE_ARTISAN_QUEUE) {
          await this.env.EDGE_ARTISAN_QUEUE.send({
            type: "report.ready",
            command: payload.command,
            runId: payload.runId,
          });
          controller.enqueue(emit("Queue dispatched report.ready background job", "success", "queue"));
        }

        controller.enqueue(emit("Command finished successfully", "success", "complete"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "content-type": "application/x-ndjson; charset=utf-8" },
    });
  }
}
