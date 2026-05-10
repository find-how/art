# Service Cards

Service cards show the infrastructure Pioneer inferred from application code.

## Required Cards

| Card | Proof |
|------|-------|
| Route / HTTP | `POST /checkout` |
| Security | `auth + verified` |
| D1 | `orders` table / `checkout-db` |
| Cache | `order:${id}` cache write |
| Queue | `send-receipt` job |
| Logs + analytics | request feedback |

## States

- idle
- inferred
- compiling
- wired
- running
- observable

## Rule

Every card should answer: "What infrastructure did Pioneer wire because of this code?"
