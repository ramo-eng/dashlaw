# DashLaw architecture

Modular monolith: Next.js App Router (staff app + client portal + REST `/api/v1`).

- **PostgreSQL-compatible data model** implemented on SQLite for local/dev (swap `DATABASE_URL` for Postgres in production).
- **Object storage**: local `apps/web/storage/documents` (S3-compatible adapter can replace `src/lib/storage.ts`).
- **Queue**: `Job` table with exponential backoff. Types: `document.scan`, `document.extract`, `document.completeness`, `notification.reminders`, `deadline.remind`.
- **OCR / LLM**: heuristic pipeline behind `src/lib/domain/ai.ts` so providers can be swapped. AI is assistive and source-backed.
- **Email / payments**: console email + demo checkout. Webhook signature required (`x-billing-signature`).
- **Auth**: signed httpOnly cookies; client tokens scoped to one case. MFA flag stored; enroll with a managed IdP later.
- **Tenant isolation**: every query is `firmId`-scoped. Cross-tenant IDs return 404.

Request ID → audit event → job ID can be correlated via `AuditEvent.requestId` (optional header).
