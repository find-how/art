# Code Editor Frame

The editor is the stage.

## Required Elements

- file path badge, usually `app/routes/web.ts`
- black or near-black code panel
- generated state
- highlighted business-logic lines
- small service badges when a line maps to infrastructure

## Demo Pattern

The canonical editor moment is the checkout route:

- `Route.post("/checkout")` maps to Worker HTTP entrypoint.
- `DB.table("orders").create(...)` maps to D1.
- `Cache.set(...)` maps to edge cache.
- `Queue.dispatch("send-receipt")` maps to Queues.
- `.middleware(["auth", "verified"])` maps to the security gate.

## Avoid

- toy snippets
- synthetic TODO comments
- long infrastructure config
- code that does not imply a real app
