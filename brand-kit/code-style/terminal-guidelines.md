# Terminal Guidelines

Terminal content should prove that Pioneer turned code into a running app.

## Canonical Sequence

```txt
Analyzing app/routes/web.ts
Route.post("/checkout") -> Worker HTTP entrypoint
DB.table("orders") -> D1 binding checkout-db
Cache.set("order:*") -> edge cache
Queue.dispatch("send-receipt") -> Cloudflare Queue
Starting Wrangler local Worker
POST /checkout -> 201 Created
```

## Tone

Use short, specific lines. Avoid theatrical build output.
