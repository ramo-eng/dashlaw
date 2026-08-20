# DashLaw

Immigration case-management SaaS for law firms: cases, checklists, client portal, reminders, document processing, completeness checks, AI summaries, deadlines, and templates.

This product is **administrative workflow software**, not legal advice. Eligibility, filing strategy, and representations about government requirements remain under attorney control.

## Run locally (from Cursor / VS Code)

Requires **Docker** (for local Supabase) and Node 20+.

1. Open this repository folder as the workspace.
2. Use **Run and Debug** (Ctrl/Cmd+Shift+D) → **DashLaw: Run locally**.
3. Or **Terminal → Run Task…** → **DashLaw: Start local server**.

The first run starts **Supabase** (Postgres + Storage + Studio), writes connection keys to `apps/web/.env`, pushes the Prisma schema, creates the private `case-documents` bucket, and seeds demo data if the database is empty. The app is at **http://localhost:3000**. Supabase Studio is at **http://127.0.0.1:54323**.

From a terminal in the repo root:

```bash
npm run local
```

(`npm run setup` starts Supabase and prepares the database without the Next.js server.)

**Demo staff login:** `admin@harbor.example` / `password123`  
Also: `attorney@harbor.example`, `paralegal@harbor.example` (same password).

### Hosted Supabase project

Create a project at [supabase.com](https://supabase.com), then put these in `apps/web/.env` (copy from `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (transaction pooler, port 6543, add `?pgbouncer=true`)
- `DIRECT_URL` (session/direct connection, port 5432)

Then `npm run setup` / **DashLaw: Run locally**. If `NEXT_PUBLIC_SUPABASE_URL` contains `supabase.co`, the runner skips `supabase start` and uses your hosted project.

## Stack

- Next.js + TypeScript + Tailwind (minimal UI)
- **Supabase Postgres** (Prisma) + **Supabase Storage**
- REST `/api/v1` as specified in the product document
- In-process job table (scan → extract → completeness)
- Heuristic OCR/classification/summaries with source citations (provider-swappable)

## Apps

| Path | Audience |
| --- | --- |
| `/` `/pricing` | Marketing |
| `/signup` `/login` | Firm auth |
| `/app/cases` | Staff workspace |
| `/portal/[token]` | Client magic link + OTP |

See `docs/architecture/overview.md`, `docs/api/openapi.yaml`, and `docs/runbooks/operations.md`.
