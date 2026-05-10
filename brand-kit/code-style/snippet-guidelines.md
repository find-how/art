# Snippet Guidelines

## Rules

- Keep snippets under 20 lines.
- Show business value, not toy examples.
- Prefer checkout, lead intake, booking, upload, webhook, notification, invoice, or CRM workflows.
- Every snippet should imply infrastructure without showing infrastructure config.
- Always show the generated file path.

## Preferred File Labels

```txt
app/routes/web.ts
app/jobs/send-receipt.ts
app/http/middleware/EnsureVerified.ts
```

## Avoid

- "hello world"
- abstract functions without app behavior
- low-level binding config in the first snippet
- examples that only prove routing
