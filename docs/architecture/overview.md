# DashLaw architecture

Modular monolith: Next.js App Router (staff app + client portal + REST `/api/v1`).

- **Database**: Prisma → **Supabase Postgres** (`DATABASE_URL` / `DIRECT_URL`).
- **Object storage**: **Supabase Storage** bucket `case-documents` (private). Originals are never stored in Postgres.
- **Queue**: `Job` table with exponential backoff. Types: `document.scan`, `document.extract`, `document.completeness`, `notification.reminders`, `deadline.remind`.
- **OCR / LLM**: heuristic pipeline behind `src/lib/domain/ai.ts` so providers can be swapped. AI is assistive and source-backed.
- **Email / payments**: console email + demo checkout. Webhook signature required (`x-billing-signature`).
- **Auth**: signed httpOnly cookies; client tokens scoped to one case. MFA flag stored; enroll with a managed IdP later.
- **Tenant isolation**: every query is `firmId`-scoped. Cross-tenant IDs return 404.

The API uses the database `postgres` role (bypasses Storage/API RLS). The documents bucket is private; only the service role uploads and downloads.

Request ID → audit event → job ID can be correlated via `AuditEvent.requestId` (optional header).
