# Terminal Panel

Terminal motion should prove that the app runs.

## Use For

- compile steps
- inferred bindings
- local Wrangler run
- D1 migration
- queue creation
- smoke request
- `201 Created` response

## Good Terminal Lines

```txt
Analyzing Route.post("/checkout") and middleware(["auth", "verified"])
Inferred local Cloudflare services: Worker, D1, Cache, Queue, Auth
Emitting .pioneer/cloudflare/checkout-app
D1 migrations applied locally: checkout-db
Wrangler serving checkout-app on 127.0.0.1:8789
curl POST http://127.0.0.1:8789/checkout -> 201 Created
```

## Avoid

- fake shell noise
- long dependency installs
- abstract build logs
- logs that do not map back to product proof
