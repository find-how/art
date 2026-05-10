# Canonical Checkout Route

This is the flagship Pioneer snippet.

```ts
import { Route, DB, Cache, Queue } from "@find-how/pioneer";

Route.post("/checkout", async ({ request }) => {
  const input = await request.json();

  const order = await DB.table("orders").create(input);

  await Cache.set(`order:${order.id}`, order);

  await Queue.dispatch("send-receipt", {
    orderId: order.id,
  });

  return Response.json({ ok: true, order }, { status: 201 });
}).middleware(["auth", "verified"]);
```

## File Label

```txt
app/routes/web.ts
```

## Why This Snippet Works

| Code | Infrastructure |
|------|----------------|
| `Route.post("/checkout")` | Worker HTTP entrypoint |
| `DB.table("orders").create(input)` | D1 write |
| `Cache.set(...)` | edge cache |
| `Queue.dispatch("send-receipt")` | Cloudflare Queues |
| `.middleware(["auth", "verified"])` | auth/security gate |
| `Response.json(..., { status: 201 })` | web standard response |
