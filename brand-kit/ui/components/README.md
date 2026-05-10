# Interactive Webview Components

These components are the reusable browser surfaces for Pioneer demos, docs, and embedded webviews.

## Components

| Component | File | Use |
|-----------|------|-----|
| Realtime browser demo | `browser-demo.html` | Monaco editor plus Pioneer terminal feedback loop. |
| Monaco editor | `monaco-editor.html` | Typed Pioneer route editor using the Demo theme. |
| xterm terminal | `xterm-terminal.html` | Wrangler/Pioneer terminal output component. |
| Edge Artisan console | `edge-artisan-console.html` and `edge-artisan-worker.ts` | xterm terminal driving an Artisan command through a Worker and Durable Object command driver. |
| Docs search | `docs-search.html` | `find.how/docs` style search trigger and command palette. |
| find.how navigation | `findhow-navigation.html` | Desktop flyouts plus mobile tabbed drawer. |

## Rule

Every component should demonstrate product proof, not decoration. The editor, terminal, search, and nav should make it easier to understand or reuse the Pioneer story.

## Edge Artisan Runtime

The portal includes a live `/__artisan` endpoint. The browser posts a command payload, the Worker forwards it to the `ARTISAN_SESSIONS` Durable Object, and the Durable Object streams NDJSON lines back into xterm.

The driver works with only Durable Object storage configured, then upgrades automatically when these optional bindings are added:

| Binding | Cloudflare primitive |
|---------|----------------------|
| `EDGE_ARTISAN_DB` | D1 |
| `EDGE_ARTISAN_KV` | KV |
| `EDGE_ARTISAN_REPORTS` | R2 |
| `EDGE_ARTISAN_QUEUE` | Queues |
