# Runbooks

## Database unavailable
Serve a maintenance page. Jobs remain queued. Restore the latest SQLite/Postgres backup; `prisma migrate deploy`.

## Object storage outage
Reject new uploads with a readable error. Existing metadata remains in the database. Retry `document.scan` after storage recovers.

## Email outage
Notifications stay `queued`/`sent` via the console provider in development. In production, retry with provider backoff; do not duplicate `idempotencyKey`.

## OCR / LLM outage
Documents remain in Processing. Staff can retry via `/documents/{id}/process`. Summaries fail visibly; never write unverified facts onto the case.

## Billing webhook outage
Replay signed webhooks. Reject unsigned payloads (SEC-010). Idempotency keys prevent double apply.

## Compromised account
Deactivate the user (`status=deactivated`), rotate `SESSION_SECRET`, review `/app/audit` for document downloads and role changes.
