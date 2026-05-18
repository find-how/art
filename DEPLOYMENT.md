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
curl -s https://brand.find.how/assets/manifest.json
```

The interactive Edge Artisan console posts to `/__artisan`. It works with only the Durable Object binding, then uses fallback Durable Object storage where optional Cloudflare primitives are not bound.

## Private Plus Components

The `/plus/` component browser is intentionally private because it contains Pioneer-branded derivatives of licensed Tailwind Plus components.

- Normal `npm run build` excludes the private Plus catalog.
- `npm run dev` and `npm run preview` generate a local private catalog in `dist/plus` and expose `/plus/` for local review.
- Production Plus deploys should use `npm run deploy:plus`, which builds the private catalog and injects `PLUS_COMPONENTS_ENABLED:true` as a Worker var.
- Protect `https://brand.find.how/plus/*` and `https://brand.find.how/api/plus/*` with Cloudflare Access.
- Optionally set `PLUS_ACCESS_EMAIL_DOMAIN=find.how` so the Worker rejects Access-authenticated users outside the allowed domain.

## Optional Edge Artisan Bindings

The production demo can communicate with more Cloudflare primitives when they are added to `wrangler.toml`:

| Binding | Primitive | Used for |
| --- | --- | --- |
| `EDGE_ARTISAN_DB` | D1 | Run SQL-backed command examples. |
| `EDGE_ARTISAN_KV` | KV | Store the latest command/session metadata. |
| `EDGE_ARTISAN_REPORTS` | R2 | Save generated command artifacts. |
| `EDGE_ARTISAN_QUEUE` | Queues | Dispatch follow-up jobs from a command. |

Use `wrangler.optional-bindings.example.toml` as the copy-in template after creating the D1 database, KV namespace, R2 bucket, and Queue in Cloudflare.
