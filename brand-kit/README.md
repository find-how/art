# Pioneer Brand Kit

This is the source of truth for the Pioneer brand.

The central idea is:

> Developers write business logic. Pioneer turns it into a running Cloudflare edge app.

The Demo is the clearest expression of the brand. It starts with a business request, generates focused TypeScript code, then shows Pioneer wiring the Worker, D1, Cache, Queue, auth, logs, and local Wrangler feedback around it.

## Brand Foundation

| Field | Value |
|------|-------|
| Company / ecosystem | find.how |
| Product | Pioneer |
| Category | Full-stack TypeScript framework for Cloudflare-native applications |
| One-liner | Write business logic. Ship edge infrastructure. |
| Positioning | Pioneer is the full-stack TypeScript framework that turns application business logic into production-ready Cloudflare edge infrastructure. |
| Short version | Write business logic. Pioneer compiles the infrastructure. |
| Mission | Make globally distributed software feel as simple as writing application code. |

## Public Story

Lead with the market-facing wedge:

1. Write business logic in TypeScript.
2. Pioneer infers the Cloudflare-shaped app.
3. Routes become Workers, DB calls become D1 bindings, cache calls become edge cache, queue dispatches become background jobs.
4. Wrangler gives local production-shaped feedback before deploy.

The compiler, TypeGraph, DI rules, and internal verification model are the moat. They belong in technical proof, docs, and architecture material, not the first sentence.

## Canonical Messaging

| Use | Copy |
|-----|------|
| Tagline | Write business logic. Ship edge infrastructure. |
| Main headline | The full-stack TypeScript framework that compiles to the edge. |
| Demo headline | Ask for the endpoint. Pioneer turns the generated code into the app. |
| Subheadline | Pioneer lets you write application logic in TypeScript, then wires the Cloudflare Worker, database, cache, queue, auth, logs, and deploy path around it. |
| Developer framing | You write the route. Pioneer wires the rest. |
| AI framing | AI writes code. Pioneer makes it deployable. |
| Investor framing | Pioneer is the missing framework layer for Cloudflare's developer platform. |

## Minimum Viable Kit

| Priority | Asset |
|----------|-------|
| 1 | One-liner |
| 2 | 30-second pitch |
| 3 | 60-second demo script |
| 4 | Logo and mark |
| 5 | Deploy to Pioneer button |
| 6 | Color tokens |
| 7 | Typography tokens |
| 8 | Canonical checkout code snippet |
| 9 | GitHub banner |
| 10 | Landing page hero |
| 11 | Pitch deck theme |
| 12 | Cloudflare Workers Launchpad one-pager |

## Folder Map

| Directory | Role |
|-----------|------|
| `foundation/` | Positioning, mission, audience, personality, approved language. |
| `messaging/` | Reusable one-liners and pitch lengths. |
| `logo/` | Logo aliases, mark assets, app icon, and deploy button assets. |
| `colors/` | Official CSS and JSON tokens plus usage rules. |
| `typography/` | Instrument Sans, Commit Mono, and type scale guidance. |
| `ui/` | Product component guidance and interactive webview snippets taken from the Demo and find.how. |
| `code-style/` | Canonical checkout route, snippet rules, terminal copy rules. |
| `demo/` | One-minute demo script and demo beats. |
| `assets/` | Landing, social, GitHub, Open Graph, launchpad, docs, and pitch-deck source assets. |
| `guidelines/` | Do/don't language, co-branding, Cloudflare language, screenshot rules. |

## Public Hierarchy

1. Full-stack TypeScript framework
2. Compiles to Cloudflare edge infrastructure
3. Laravel-style ergonomics
4. AI-friendly generated business logic
5. Rust compiler and TypeGraph as moat

## Internal Hierarchy

1. Compiler
2. TypeGraph
3. Cloudflare mapping
4. Framework APIs
5. AI/control plane

Keep those two orders separate. The internal truth is how Pioneer works. The public story is why developers care.
