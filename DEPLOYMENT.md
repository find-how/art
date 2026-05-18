# Cloudflare Deployment

This repo is set up as a Cloudflare Workers app with Workers Assets and a Durable Object command session for the Edge Artisan demo.

## Production Target

| Setting | Value |
| --- | --- |
| Worker name | `pioneer-brand-assets` |
| Custom domain | `brand.find.how` |
| Worker entrypoint | `src/index.js` |
| Static assets | `dist/` through the `ASSETS` binding |
| Durable Object | `ARTISAN_SESSIONS` -> `EdgeArtisanSession` |
| Durable Object migration | `v1`, SQLite storage |

Wrangler runs `npm run build` automatically before `wrangler dev` and `wrangler deploy` through the `[build]` section in `wrangler.toml`.

## First-Time Setup

```bash
npm install
npx wrangler login
```

The Cloudflare account needs access to the `find.how` zone so Wrangler can attach the custom domain route for `brand.find.how`.

For token-based deploys instead of interactive login, set a `CLOUDFLARE_API_TOKEN` with Workers Scripts edit permissions and zone access for `find.how`.

## Validate Before Deploying

```bash
npm run check
npm run deploy:dry-run
```

`npm run check` rebuilds the static portal and syntax-checks the Worker and browser scripts. `npm run deploy:dry-run` asks Wrangler to build and validate the deploy bundle without publishing it.

## GitHub CI/CD

The repository includes `.github/workflows/brand-find-how.yml`.

| Event | Behavior |
| --- | --- |
| Pull request into `main` or `master` | Install dependencies, build, syntax-check, and run `wrangler deploy --dry-run`. |
| Push to `main` or `master` | Run validation, then deploy to `https://brand.find.how`. |
| Manual `workflow_dispatch` | Run validation, then deploy when the `deploy` input is true. |

Add these GitHub repository secrets before enabling production deploys:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID that owns the Worker. |
| `CLOUDFLARE_API_TOKEN` | API token scoped to deploy Workers and access the `find.how` zone. |

The deploy job targets the GitHub `production` environment with `https://brand.find.how` as the environment URL. Use GitHub environment protection rules if production deploys should require approval after merge.

## Deploy

```bash
npm run deploy
```

The first deploy applies the Durable Object migration declared in `wrangler.toml`:

```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["EdgeArtisanSession"]
```

Future Worker code changes do not need another Durable Object migration unless the Durable Object class is created, renamed, deleted, or transferred.

## Post-Deploy Smoke Checks

```bash
curl -sI https://brand.find.how/
curl -s https://brand.find.how/api/health
curl -s https://brand.find.how/api/brand
curl -s https://brand.find.how/api/brand/context
curl -s https://brand.find.how/assets/manifest.json
```

The interactive Edge Artisan console posts to `/__artisan`. It works with only the Durable Object binding, then uses fallback Durable Object storage where optional Cloudflare primitives are not bound.

## Private Plus Components

The `/plus/` component browser is intentionally private because it contains Pioneer-branded derivatives of licensed Tailwind Plus components.

- Normal `npm run build` excludes the private Plus catalog.
- `npm run dev` and `npm run preview` generate a local private catalog in `dist/plus` and expose `/plus/` for local review.
- Production Plus deploys should use `npm run deploy:plus`, which builds the private catalog and injects `PLUS_COMPONENTS_ENABLED:true` as a Worker var.
- Protect `https://brand.find.how/plus/*`, `https://brand.find.how/api/plus/*`, and private Plus usage through `https://brand.find.how/mcp` with Cloudflare Access.
- Optionally set `PLUS_ACCESS_EMAIL_DOMAIN=find.how` so the Worker rejects Access-authenticated users outside the allowed domain.
- For automated agents, create a Cloudflare Access service token and add its client ID to `PLUS_ACCESS_SERVICE_TOKEN_IDS`.
- For Worker-side Access JWT validation, configure `CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `CLOUDFLARE_ACCESS_AUD`; the Worker validates `Cf-Access-Jwt-Assertion` before honoring service token IDs.

## MCP Endpoint

The same Worker serves a stateless Streamable HTTP MCP server at `/mcp`. It exposes public Pioneer brand context and asset tools, plus gated Plus component search/source tools for authenticated users or configured service-token clients.

Agents should use `plus_find_component_code` for natural-language component requests such as "a component for the top of a launch page" or "a dashboard sidebar shell". It ranks the private Tailwind Plus catalog and returns the selected Pioneer-branded source code plus alternatives. `plus_search_components` and `plus_get_component_source` are still available for exact lookup workflows.

Useful local checks:

```bash
curl -s http://127.0.0.1:8789/api/brand/context
curl -s "http://127.0.0.1:8789/api/plus/components?library=app&format=react&limit=3"
```

## Optional Edge Artisan Bindings

The production demo can communicate with more Cloudflare primitives when they are added to `wrangler.toml`:

| Binding | Primitive | Used for |
| --- | --- | --- |
| `EDGE_ARTISAN_DB` | D1 | Run SQL-backed command examples. |
| `EDGE_ARTISAN_KV` | KV | Store the latest command/session metadata. |
| `EDGE_ARTISAN_REPORTS` | R2 | Save generated command artifacts. |
| `EDGE_ARTISAN_QUEUE` | Queues | Dispatch follow-up jobs from a command. |

Use `wrangler.optional-bindings.example.toml` as the copy-in template after creating the D1 database, KV namespace, R2 bucket, and Queue in Cloudflare.
