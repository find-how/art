import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import * as z from "zod/v4";
import { brandConfig } from "./brand-config.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

function originUrl(origin, href) {
  return new URL(href, origin).toString();
}

function brandContext(env, request) {
  const brand = configuredBrand(env);
  const origin = brand.origin || request.url;

  return {
    name: brand.name,
    product: brand.product,
    domain: brand.domain,
    origin: brand.origin,
    description: brand.description,
    positioning: brand.positioning,
    colors: brand.colors,
    typography: {
      fonts: {
        sans: "Instrument Sans",
        mono: "Commit Mono"
      },
      tokenUrl: originUrl(origin, "/assets/brand-kit/colors/tokens.css"),
      typeScaleUrl: originUrl(origin, "/assets/brand-kit/typography/type-scale.md"),
      rules: [
        "Use Instrument Sans for interface and brand copy.",
        "Use Commit Mono for code, terminals, paths, and compact status text.",
        "Keep letter spacing at 0.",
        "Reserve hero-scale type for first-viewport product and launch pages.",
        "Keep panel, dashboard, editor, and terminal headings compact."
      ],
      scale: [
        { role: "H1", size: "56-88px", weight: "700" },
        { role: "H2", size: "36-48px", weight: "700" },
        { role: "H3", size: "22-28px", weight: "700" },
        { role: "Body", size: "16-18px", weight: "400-520" },
        { role: "Small UI", size: "12-14px", weight: "650-800" },
        { role: "Code", size: "13-15px", weight: "400-650" }
      ]
    },
    assets: {
      manifestUrl: originUrl(origin, "/assets/manifest.json"),
      logoUrls: {
        colorMark: originUrl(origin, "/assets/pioneer-logo.svg"),
        blackMark: originUrl(origin, "/assets/pioneer-logo-black.svg"),
        whiteMark: originUrl(origin, "/assets/pioneer-logo-white.svg"),
        colorWordmark: originUrl(origin, "/assets/pioneer-text.svg"),
        blackWordmark: originUrl(origin, "/assets/pioneer-text-logo-black.svg"),
        whiteWordmark: originUrl(origin, "/assets/pioneer-text-white.svg")
      },
      iconsUrl: originUrl(origin, "/assets/icons-color/64x64.png")
    },
    interface: {
      principles: brand.experiencePrinciples,
      deployActions: brand.deployActions,
      componentDocsUrl: originUrl(origin, "/assets/brand-kit/ui/components/README.md"),
      buttonSnippetUrl: originUrl(origin, "/assets/buttons/pioneer-deploy-button.html")
    },
    plus: {
      browserUrl: originUrl(origin, "/plus/"),
      catalogUrl: originUrl(origin, "/api/plus/catalog.json"),
      access: "private"
    },
    resources: brand.resources.map((resource) => ({
      ...resource,
      url: originUrl(origin, resource.href)
    }))
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

async function assetFetch(env, request, pathname) {
  const assetUrl = new URL(pathname, request.url);
  if (request.method === "GET" || request.method === "HEAD") {
    return env.ASSETS.fetch(new Request(assetUrl, request));
  }

  return env.ASSETS.fetch(
    new Request(assetUrl, {
      method: "GET",
      cf: request.cf
    })
  );
}

async function assetJson(env, request, pathname) {
  const response = await assetFetch(env, request, pathname);

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

async function readAssetText(env, request, pathname) {
  const response = await assetFetch(env, request, pathname);
  if (!response.ok) return null;
  return response.text();
}

async function readAssetJson(env, request, pathname) {
  const text = await readAssetText(env, request, pathname);
  if (text === null) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function privateJson(data, init = {}) {
  return json(data, {
    ...init,
    headers: {
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
      ...init.headers
    }
  });
}

function isEnabled(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

function hostHeaderName(value) {
  const host = String(value || "").trim().toLowerCase();
  if (!host) return "";
  if (host.startsWith("[") && host.includes("]")) {
    return host.slice(1, host.indexOf("]"));
  }

  return host.split(":")[0];
}

function isLocalHostname(value) {
  return ["127.0.0.1", "localhost", "::1"].includes(value);
}

function isLocalRequest(request, url) {
  return [url.hostname, hostHeaderName(request.headers.get("host"))].some(isLocalHostname);
}

function plusAccessEmail(request) {
  return (
    request.headers.get("cf-access-authenticated-user-email") ||
    request.headers.get("CF-Access-Authenticated-User-Email") ||
    ""
  ).trim();
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function base64UrlDecode(value) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeJwtPart(value) {
  return JSON.parse(decoder.decode(base64UrlDecode(value)));
}

function accessJwtToken(request) {
  return (
    request.headers.get("cf-access-jwt-assertion") ||
    request.headers.get("Cf-Access-Jwt-Assertion") ||
    request.headers.get("cf-access-token") ||
    ""
  ).trim();
}

function accessTeamDomain(env) {
  const value = String(env.CLOUDFLARE_ACCESS_TEAM_DOMAIN || env.ACCESS_TEAM_DOMAIN || "").trim();
  if (!value) return "";
  return value.includes(".") ? value : `${value}.cloudflareaccess.com`;
}

function hasExpectedAudience(payload, expectedAudience) {
  const expected = splitCsv(expectedAudience);
  if (!expected.length) return true;

  const claim = payload?.aud;
  const actual = Array.isArray(claim) ? claim : [claim].filter(Boolean);
  return expected.some((audience) => actual.includes(audience));
}

async function verifyAccessJwt(token, env) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJwtPart(encodedHeader);
  const payload = decodeJwtPart(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) return null;
  if (payload.nbf && now < payload.nbf) return null;
  if (!hasExpectedAudience(payload, env.CLOUDFLARE_ACCESS_AUD || env.ACCESS_AUD)) return null;

  const teamDomain = accessTeamDomain(env);
  if (!teamDomain) return null;

  const expectedIssuer = `https://${teamDomain}`;
  if (payload.iss && payload.iss !== expectedIssuer) return null;

  const certsUrl = String(env.CLOUDFLARE_ACCESS_CERTS_URL || `https://${teamDomain}/cdn-cgi/access/certs`);
  const certsResponse = await fetch(certsUrl, {
    headers: { accept: "application/json" }
  });
  if (!certsResponse.ok) return null;

  const certs = await certsResponse.json();
  const jwk = certs.keys?.find((key) => key.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signature = base64UrlDecode(encodedSignature);
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const verified = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data);

  return verified ? payload : null;
}

async function accessIdentity(request, env) {
  const token = accessJwtToken(request);
  const emailHeader = plusAccessEmail(request);

  if (!token) {
    return {
      email: emailHeader,
      serviceTokenId: "",
      jwtPresent: false,
      jwtVerified: false
    };
  }

  let verifiedPayload = null;
  try {
    verifiedPayload = await verifyAccessJwt(token, env);
  } catch (error) {
    console.warn("access.jwt.verify_failed", error);
  }

  return {
    email: verifiedPayload?.email || emailHeader,
    serviceTokenId: verifiedPayload?.common_name || "",
    jwtPresent: true,
    jwtVerified: Boolean(verifiedPayload)
  };
}

async function canAccessPlus(request, env, url, identity = null) {
  if (isLocalRequest(request, url) || isEnabled(env.PLUS_COMPONENTS_DEV_BYPASS)) {
    return true;
  }

  if (!isEnabled(env.PLUS_COMPONENTS_ENABLED)) {
    return false;
  }

  const resolvedIdentity = identity || (await accessIdentity(request, env));
  const allowedServiceTokens = splitCsv(env.PLUS_ACCESS_SERVICE_TOKEN_IDS);
  if (resolvedIdentity.serviceTokenId && allowedServiceTokens.includes(resolvedIdentity.serviceTokenId)) {
    return true;
  }

  const email = resolvedIdentity.email;
  if (!email) {
    return false;
  }

  const allowedDomain = String(env.PLUS_ACCESS_EMAIL_DOMAIN || "").trim().toLowerCase();
  if (!allowedDomain) {
    return true;
  }

  return email.toLowerCase().endsWith(`@${allowedDomain.replace(/^@/, "")}`);
}

async function plusAsset(env, request, pathname) {
  return assetFetch(env, request, pathname);
}

async function plusCatalog(env, request) {
  return readAssetJson(env, request, "/plus/catalog.json");
}

function componentFormatPath(component, formatId) {
  const format = component?.formats?.[formatId];
  if (!format) return null;
  return `/plus/source/${component.library}/${formatId}/${format.originalPath}`;
}

function publicFormat(format) {
  return {
    label: format.label,
    extension: format.extension,
    url: format.url
  };
}

function publicComponent(component) {
  return {
    id: component.id,
    library: component.library,
    libraryLabel: component.libraryLabel,
    category: component.category,
    categoryLabel: component.categoryLabel,
    subcategory: component.subcategory,
    subcategoryLabel: component.subcategoryLabel,
    groupPath: component.groupPath,
    name: component.name,
    previewUrl: component.previewUrl,
    formats: Object.fromEntries(
      Object.entries(component.formats || {}).map(([formatId, format]) => [formatId, publicFormat(format)])
    )
  };
}

function parseLimit(value, fallback = 12, max = 50) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.min(max, numeric));
}

function filterPlusComponents(catalog, filters) {
  const query = String(filters.query || "").trim().toLowerCase();
  const library = String(filters.library || "").trim();
  const category = String(filters.category || "").trim();
  const format = String(filters.format || "").trim();
  const limit = parseLimit(filters.limit, 12);

  return (catalog?.components || [])
    .filter((component) => {
      const fields = [
        component.name,
        component.libraryLabel,
        component.categoryLabel,
        component.subcategoryLabel,
        component.groupPath
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!library || component.library === library) &&
        (!category || component.category === category) &&
        (!format || component.formats?.[format]) &&
        (!query || fields.includes(query))
      );
    })
    .slice(0, limit)
    .map(publicComponent);
}

const PLUS_COMPONENT_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "component",
  "for",
  "from",
  "go",
  "goes",
  "going",
  "in",
  "into",
  "is",
  "it",
  "need",
  "needs",
  "of",
  "on",
  "onto",
  "or",
  "our",
  "page",
  "part",
  "section",
  "that",
  "the",
  "this",
  "to",
  "ui",
  "use",
  "we",
  "with",
  "x"
]);

const PLUS_COMPONENT_SYNONYMS = {
  admin: ["dashboard", "application", "shell", "sidebar"],
  app: ["application", "dashboard", "shell"],
  auth: ["login", "signin", "signup", "authentication"],
  banner: ["announcement", "cta"],
  blog: ["article", "content", "post"],
  cards: ["grid", "list"],
  chart: ["analytics", "dashboard", "stats"],
  checkout: ["form", "payment", "commerce"],
  dashboard: ["application", "shell", "sidebar", "stats"],
  dialog: ["modal", "overlay"],
  docs: ["documentation", "content", "sidebar"],
  footer: ["navigation", "marketing"],
  form: ["input", "field", "settings"],
  hero: ["landing", "headline", "marketing"],
  homepage: ["landing", "hero", "marketing"],
  landing: ["hero", "marketing", "page"],
  login: ["auth", "signin"],
  modal: ["dialog", "overlay"],
  navbar: ["navigation", "header"],
  pricing: ["plans", "tiers", "marketing"],
  profile: ["avatar", "settings"],
  settings: ["form", "profile"],
  shell: ["application", "dashboard", "sidebar"],
  sidebar: ["navigation", "application", "shell"],
  signin: ["login", "auth"],
  signup: ["register", "auth"],
  stats: ["metrics", "analytics"],
  table: ["list", "data"],
  testimonials: ["reviews", "social", "proof"]
};

function normalizePlusText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizePlusIntent(...values) {
  const tokens = new Set();
  const phrase = normalizePlusText(values.filter(Boolean).join(" "));

  for (const token of phrase.split(/\s+/)) {
    if (!token || PLUS_COMPONENT_STOP_WORDS.has(token)) continue;
    tokens.add(token);

    for (const synonym of PLUS_COMPONENT_SYNONYMS[token] || []) {
      if (!PLUS_COMPONENT_STOP_WORDS.has(synonym)) tokens.add(synonym);
    }
  }

  return {
    phrase,
    tokens: Array.from(tokens)
  };
}

function inferPlusLibrary(intent) {
  const marketingTerms = new Set([
    "announcement",
    "blog",
    "cta",
    "feature",
    "footer",
    "hero",
    "homepage",
    "landing",
    "marketing",
    "newsletter",
    "pricing",
    "social",
    "testimonial",
    "testimonials"
  ]);
  const appTerms = new Set([
    "admin",
    "app",
    "application",
    "auth",
    "checkout",
    "dashboard",
    "dialog",
    "form",
    "login",
    "modal",
    "profile",
    "settings",
    "shell",
    "sidebar",
    "table"
  ]);

  const marketingScore = intent.tokens.filter((token) => marketingTerms.has(token)).length;
  const appScore = intent.tokens.filter((token) => appTerms.has(token)).length;

  if (marketingScore > appScore) return "marketing";
  if (appScore > marketingScore) return "app";
  return "";
}

function plusComponentSearchText(component) {
  return normalizePlusText(
    [
      component.id,
      component.library,
      component.libraryLabel,
      component.category,
      component.categoryLabel,
      component.subcategory,
      component.subcategoryLabel,
      component.groupPath,
      component.name
    ].join(" ")
  );
}

function scorePlusComponent(component, intent, filters = {}) {
  const library = String(filters.library || "").trim();
  const inferredLibrary = library || inferPlusLibrary(intent);

  if (library && component.library !== library) {
    return null;
  }

  if (filters.format && !component.formats?.[filters.format]) {
    return null;
  }

  const componentText = plusComponentSearchText(component);
  const nameText = normalizePlusText(component.name);
  const categoryText = normalizePlusText(component.categoryLabel || component.category);
  const subcategoryText = normalizePlusText(component.subcategoryLabel || component.subcategory);
  const groupText = normalizePlusText(component.groupPath);
  const idText = normalizePlusText(component.id);
  const reasons = [];
  let score = 0;

  if (inferredLibrary && component.library === inferredLibrary) {
    score += library ? 18 : 8;
    reasons.push(`${component.libraryLabel} library`);
  }

  if (intent.phrase && componentText.includes(intent.phrase)) {
    score += 28;
    reasons.push("exact phrase match");
  }

  for (const token of intent.tokens) {
    if (nameText.includes(token)) {
      score += 12;
      reasons.push(`name:${token}`);
    } else if (categoryText.includes(token)) {
      score += 9;
      reasons.push(`category:${token}`);
    } else if (subcategoryText.includes(token)) {
      score += 7;
      reasons.push(`subcategory:${token}`);
    } else if (groupText.includes(token)) {
      score += 5;
      reasons.push(`group:${token}`);
    } else if (idText.includes(token) || componentText.includes(token)) {
      score += 3;
      reasons.push(`metadata:${token}`);
    }
  }

  if (!score && inferredLibrary && component.library === inferredLibrary) {
    score = 1;
  }

  if (!score) return null;

  return {
    component,
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 8)
  };
}

function rankPlusComponents(catalog, filters = {}) {
  const intent = tokenizePlusIntent(filters.request, filters.surface, filters.placement, filters.query);
  const limit = parseLimit(filters.limit, 3, 10);

  return (catalog?.components || [])
    .map((component) => scorePlusComponent(component, intent, filters))
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.component.id.localeCompare(right.component.id);
    })
    .slice(0, limit)
    .map((match) => ({
      score: match.score,
      reasons: match.reasons,
      component: publicComponent(match.component)
    }));
}

async function plusComponentSearch(env, request, url) {
  const catalog = await plusCatalog(env, request);
  if (!catalog) {
    return { error: "Private Plus catalog not built.", status: 404 };
  }

  return {
    generatedAt: catalog.generatedAt,
    notice: catalog.notice,
    counts: catalog.counts,
    components: filterPlusComponents(catalog, {
      library: url.searchParams.get("library"),
      category: url.searchParams.get("category"),
      query: url.searchParams.get("q"),
      format: url.searchParams.get("format"),
      limit: url.searchParams.get("limit")
    })
  };
}

async function plusComponentResolve(env, request, filters = {}) {
  const catalog = await plusCatalog(env, request);
  if (!catalog) {
    return { error: "Private Plus catalog not built.", status: 404 };
  }

  const format = ["html", "react", "vue"].includes(filters.format) ? filters.format : "react";
  const matches = rankPlusComponents(catalog, {
    ...filters,
    format,
    limit: filters.limit || 4
  });
  const selected = matches[0] || null;

  if (!selected) {
    return {
      request: filters.request || filters.query || "",
      format,
      selected: null,
      alternatives: []
    };
  }

  const source = await plusSource(env, request, selected.component.id, format);
  if (!source) {
    return {
      request: filters.request || filters.query || "",
      format,
      selected,
      alternatives: matches.slice(1),
      error: `Best match did not have ${format} source.`
    };
  }

  return {
    request: filters.request || filters.query || "",
    surface: filters.surface || null,
    placement: filters.placement || null,
    format,
    selected,
    alternatives: matches.slice(1),
    source: source.source
  };
}

async function plusSource(env, request, componentId, formatId) {
  const catalog = await plusCatalog(env, request);
  const component = catalog?.components?.find((entry) => entry.id === componentId);
  const pathname = componentFormatPath(component, formatId);
  if (!pathname) return null;

  const source = await readAssetText(env, request, pathname);
  if (source === null) return null;

  return {
    component: publicComponent(component),
    format: publicFormat(component.formats[formatId]),
    source
  };
}

async function searchBrandAssets(env, request, filters = {}) {
  const manifest = await readAssetJson(env, request, "/assets/manifest.json");
  const origin = configuredBrand(env).origin || request.url;
  const query = String(filters.query || "").trim().toLowerCase();
  const limit = parseLimit(filters.limit, 20);
  const type = String(filters.type || "").trim().toLowerCase();
  const variant = String(filters.variant || "").trim().toLowerCase();
  const platform = String(filters.platform || "").trim().toLowerCase();

  const assets = (manifest?.assets || [])
    .filter((asset) => {
      const fields = [asset.name, asset.path, asset.type, asset.variant, asset.platform, asset.family]
        .join(" ")
        .toLowerCase();

      return (
        (!query || fields.includes(query)) &&
        (!type || String(asset.type || "").toLowerCase().includes(type)) &&
        (!variant || String(asset.variant || "").toLowerCase() === variant) &&
        (!platform || String(asset.platform || "").toLowerCase().includes(platform))
      );
    })
    .slice(0, limit)
    .map((asset) => ({
      ...asset,
      absoluteUrl: originUrl(origin, asset.url),
      absoluteDownloadUrl: originUrl(origin, asset.downloadUrl)
    }));

  return {
    generatedAt: manifest?.generatedAt || null,
    counts: manifest?.counts || null,
    assets
  };
}

async function getBrandAsset(env, request, idOrPath) {
  const manifest = await readAssetJson(env, request, "/assets/manifest.json");
  const origin = configuredBrand(env).origin || request.url;
  const normalized = String(idOrPath || "").trim();
  const asset = manifest?.assets?.find((entry) => entry.id === normalized || entry.path === normalized);
  if (!asset) return null;

  return {
    ...asset,
    absoluteUrl: originUrl(origin, asset.url),
    absoluteDownloadUrl: originUrl(origin, asset.downloadUrl)
  };
}

function mcpJson(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

function mcpError(message) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: message
      }
    ]
  };
}

function resourceJson(uri, data) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

async function requirePlusAccess(request, env, url, identity) {
  if (await canAccessPlus(request, env, url, identity)) {
    return true;
  }

  return false;
}

function createPioneerMcpServer(request, env, url, identity) {
  const server = new McpServer({
    name: "pioneer-brand-find-how",
    version: "0.1.0"
  });

  server.registerTool(
    "brand_get_context",
    {
      title: "Get Pioneer brand context",
      description:
        "Return Pioneer brand positioning, colors, typography, key asset URLs, UI principles, deploy actions, and private Plus component entrypoints."
    },
    async () => mcpJson(brandContext(env, request))
  );

  server.registerTool(
    "brand_search_assets",
    {
      title: "Search Pioneer brand assets",
      description:
        "Search public Pioneer logos, icons, diagrams, launch assets, buttons, docs covers, and generated brand asset metadata.",
      inputSchema: {
        query: z.string().optional().describe("Search text matched against asset name, path, type, variant, platform, and family."),
        type: z.string().optional().describe("Optional asset type filter, such as Logo, Wordmark, Design token CSS, or Deploy button artwork."),
        variant: z.string().optional().describe("Optional exact variant filter, such as Color, Black, or White."),
        platform: z.string().optional().describe("Optional platform/family filter, such as Brand, Interface, or Social."),
        limit: z.number().int().min(1).max(50).optional().describe("Maximum number of assets to return. Defaults to 20.")
      }
    },
    async (filters = {}) => mcpJson(await searchBrandAssets(env, request, filters))
  );

  server.registerTool(
    "brand_get_asset",
    {
      title: "Get Pioneer brand asset",
      description:
        "Return one public Pioneer brand asset by manifest id, path, or a simple search query, including absolute URL and download URL.",
      inputSchema: {
        idOrPath: z
          .string()
          .optional()
          .describe("The asset manifest id or path, for example pioneer-logo-svg or pioneer-logo.svg."),
        path: z.string().optional().describe("Alias for idOrPath when the agent has an asset path."),
        query: z.string().optional().describe("Search query fallback, such as favicon, logo, icon, black mark, or deploy button.")
      }
    },
    async ({ idOrPath, path, query }) => {
      const lookup = idOrPath || path || query;
      if (!lookup) {
        return mcpError("Expected idOrPath, path, or query.");
      }

      let asset = await getBrandAsset(env, request, lookup);
      if (!asset && query) {
        const results = await searchBrandAssets(env, request, { query, limit: 1 });
        asset = results.assets[0] || null;
      }

      return asset ? mcpJson(asset) : mcpError(`No Pioneer brand asset found for ${lookup}.`);
    }
  );

  server.registerTool(
    "plus_search_components",
    {
      title: "Search Pioneer Plus components",
      description:
        "Search private Pioneer-branded Tailwind Plus application and marketing UI components. Requires Plus access.",
      inputSchema: {
        query: z.string().optional().describe("Search text matched against component name, category, subcategory, and group path."),
        library: z.enum(["app", "marketing"]).optional().describe("Component library to search."),
        category: z.string().optional().describe("Optional category slug, such as forms, navigation, sections, or page-examples."),
        format: z.enum(["html", "react", "vue"]).optional().describe("Only return components that include this source format."),
        limit: z.number().int().min(1).max(50).optional().describe("Maximum number of components to return. Defaults to 12.")
      }
    },
    async (filters = {}) => {
      if (!(await requirePlusAccess(request, env, url, identity))) {
        return mcpError("Private Plus components require Cloudflare Access or a configured Plus service token.");
      }

      const searchUrl = new URL(request.url);
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) searchUrl.searchParams.set(key === "query" ? "q" : key, String(value));
      }

      return mcpJson(await plusComponentSearch(env, request, searchUrl));
    }
  );

  server.registerTool(
    "plus_get_component_source",
    {
      title: "Get Pioneer Plus component source",
      description:
        "Return exact private source for a Pioneer-branded Tailwind Plus component in HTML, React JSX, or Vue format. Requires Plus access.",
      inputSchema: {
        id: z.string().describe("Component id from plus_search_components."),
        format: z.enum(["html", "react", "vue"]).describe("Source format to return.")
      }
    },
    async ({ id, format }) => {
      if (!(await requirePlusAccess(request, env, url, identity))) {
        return mcpError("Private Plus component source requires Cloudflare Access or a configured Plus service token.");
      }

      const source = await plusSource(env, request, id, format);
      return source ? mcpJson(source) : mcpError(`No ${format} source found for Plus component ${id}.`);
    }
  );

  server.registerTool(
    "plus_find_component_code",
    {
      title: "Find Pioneer Plus component code",
      description:
        "Given a natural-language frontend need, find the best private Pioneer-branded Tailwind Plus component and return its exact HTML, React JSX, or Vue source. Use this when an agent is asked for a component for a page, section, dashboard, modal, form, hero, pricing block, navigation area, or similar placement. Requires Plus access.",
      inputSchema: {
        request: z
          .string()
          .describe(
            "Natural-language component request, for example 'a hero for a launch page', 'a sidebar shell for a dashboard', or 'a pricing section for the marketing page'."
          ),
        surface: z
          .string()
          .optional()
          .describe("Optional page or product surface, such as landing page, docs, dashboard, settings, checkout, or onboarding."),
        placement: z
          .string()
          .optional()
          .describe("Optional placement on the surface, such as hero, nav, sidebar, table, modal, form, pricing, footer, or CTA."),
        library: z.enum(["app", "marketing"]).optional().describe("Optional hard filter. Omit to let the resolver infer it."),
        format: z.enum(["html", "react", "vue"]).optional().describe("Source format to return. Defaults to react."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Number of ranked matches to consider and return as selected plus alternatives. Defaults to 4.")
      }
    },
    async (filters = {}) => {
      if (!(await requirePlusAccess(request, env, url, identity))) {
        return mcpError("Private Plus component code requires Cloudflare Access or a configured Plus service token.");
      }

      const result = await plusComponentResolve(env, request, filters);
      if (result.error && !result.selected) {
        return mcpError(result.error);
      }

      return mcpJson(result);
    }
  );

  server.registerResource(
    "brand-context",
    "brand://context",
    {
      title: "Pioneer Brand Context",
      description: "Agent-ready Pioneer positioning, identity, typography, assets, and UI principles.",
      mimeType: "application/json"
    },
    async (uri) => resourceJson(uri.href, brandContext(env, request))
  );

  server.registerResource(
    "brand-assets-manifest",
    "brand://assets/manifest",
    {
      title: "Pioneer Asset Manifest",
      description: "Generated inventory of public Pioneer brand assets.",
      mimeType: "application/json"
    },
    async (uri) => resourceJson(uri.href, await readAssetJson(env, request, "/assets/manifest.json"))
  );

  server.registerResource(
    "brand-color-tokens",
    "brand://tokens/colors",
    {
      title: "Pioneer Color Tokens",
      description: "Pioneer color and semantic token CSS.",
      mimeType: "text/css"
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/css",
          text: (await readAssetText(env, request, "/assets/brand-kit/colors/tokens.css")) || ""
        }
      ]
    })
  );

  server.registerResource(
    "brand-typography",
    "brand://tokens/typography",
    {
      title: "Pioneer Typography Scale",
      description: "Pioneer typography roles and usage rules.",
      mimeType: "text/markdown"
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: (await readAssetText(env, request, "/assets/brand-kit/typography/type-scale.md")) || ""
        }
      ]
    })
  );

  server.registerResource(
    "plus-catalog",
    "plus://catalog",
    {
      title: "Pioneer Plus Component Catalog",
      description: "Private catalog of Pioneer-branded application and marketing components.",
      mimeType: "application/json"
    },
    async (uri) => {
      if (!(await requirePlusAccess(request, env, url, identity))) {
        throw new Error("Private Plus catalog requires access.");
      }

      return resourceJson(uri.href, await plusCatalog(env, request));
    }
  );

  server.registerResource(
    "plus-component-source",
    new ResourceTemplate("plus://component/{id}/{format}", {
      list: undefined,
      complete: {
        format: () => ["html", "react", "vue"]
      }
    }),
    {
      title: "Pioneer Plus Component Source",
      description: "Private source for a Pioneer-branded Plus component by id and format.",
      mimeType: "text/plain"
    },
    async (uri, variables) => {
      if (!(await requirePlusAccess(request, env, url, identity))) {
        throw new Error("Private Plus component source requires access.");
      }

      const source = await plusSource(env, request, variables.id, variables.format);
      if (!source) throw new Error(`No ${variables.format} source found for Plus component ${variables.id}.`);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/plain",
            text: source.source
          }
        ]
      };
    }
  );

  server.registerPrompt(
    "pioneer_frontend_brief",
    {
      title: "Build with Pioneer brand",
      description: "A reusable frontend build brief for agents using Pioneer brand assets and Plus components.",
      argsSchema: {
        surface: z.string().optional().describe("The frontend surface to build, such as landing page, dashboard, form, shell, or docs page.")
      }
    },
    async ({ surface }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              "Build " +
              (surface || "the requested frontend") +
              " using Pioneer brand.find.how resources. Start from brand://context, use semantic Pioneer colors, Instrument Sans for UI copy, Commit Mono for code surfaces, clear affordances and feedback states, and call plus_find_component_code for fitting private Plus components before inventing new application or marketing UI."
          }
        }
      ]
    })
  );

  return server;
}

async function runMcp(request, env, ctx, url) {
  const identity = await accessIdentity(request, env);
  const server = createPioneerMcpServer(request, env, url, identity);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  await server.connect(transport);
  return transport.handleRequest(request, {
    authInfo: {
      token: identity.jwtPresent ? "cloudflare-access" : "public-brand",
      clientId: identity.serviceTokenId || identity.email || "anonymous",
      scopes: (await canAccessPlus(request, env, url, identity)) ? ["brand", "plus"] : ["brand"],
      extra: {
        email: identity.email || null,
        serviceTokenId: identity.serviceTokenId || null,
        jwtPresent: identity.jwtPresent,
        jwtVerified: identity.jwtVerified
      }
    }
  });
}

export default {
  async fetch(request, env, ctx) {
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

    if (url.pathname === "/api/brand/context") {
      return json(brandContext(env, request));
    }

    if (url.pathname === "/api/assets") {
      return assetJson(env, request, "/assets/manifest.json");
    }

    if (url.pathname === "/api/plus/components") {
      if (!(await canAccessPlus(request, env, url))) {
        return new Response(null, { status: 404 });
      }

      const result = await plusComponentSearch(env, request, url);
      if (result.error) {
        return privateJson({ error: result.error }, { status: result.status });
      }

      return privateJson(result);
    }

    if (url.pathname === "/api/plus/source") {
      if (!(await canAccessPlus(request, env, url))) {
        return new Response(null, { status: 404 });
      }

      const id = url.searchParams.get("id");
      const format = url.searchParams.get("format");
      if (!id || !["html", "react", "vue"].includes(format)) {
        return privateJson({ error: "Expected id and format=html|react|vue." }, { status: 400 });
      }

      const result = await plusSource(env, request, id, format);
      if (!result) {
        return privateJson({ error: "Plus component source not found." }, { status: 404 });
      }

      return new Response(result.source, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "private, no-store",
          "x-robots-tag": "noindex"
        }
      });
    }

    if (url.pathname === "/api/plus/catalog.json") {
      if (!(await canAccessPlus(request, env, url))) {
        return new Response(null, { status: 404 });
      }

      const response = await plusAsset(env, request, "/plus/catalog.json");
      if (!response.ok) {
        return json({ error: "Private Plus catalog not built." }, { status: 404 });
      }

      return new Response(response.body, {
        status: response.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "private, no-store",
          "x-robots-tag": "noindex"
        }
      });
    }

    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      return runMcp(request, env, ctx, url);
    }

    if (url.pathname === "/__artisan" || url.pathname.startsWith("/__artisan/")) {
      return runEdgeArtisan(request, env);
    }

    if (url.pathname === "/plus") {
      return Response.redirect(new URL("/plus/", request.url), 302);
    }

    if (url.pathname.startsWith("/plus/")) {
      if (!(await canAccessPlus(request, env, url))) {
        return new Response(null, { status: 404 });
      }

      const pathname = url.pathname;
      const response = await plusAsset(env, request, pathname);
      if (!response.ok) {
        return new Response(null, { status: response.status });
      }

      const headers = new Headers(response.headers);
      headers.set("cache-control", "private, no-store");
      headers.set("x-robots-tag", "noindex");
      return new Response(response.body, {
        status: response.status,
        headers
      });
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
