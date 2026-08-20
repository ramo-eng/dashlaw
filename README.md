# DashLaw

Immigration case-management SaaS for law firms: cases, checklists, client portal, reminders, document processing, completeness checks, AI summaries, deadlines, and templates.

This product is **administrative workflow software**, not legal advice. Eligibility, filing strategy, and representations about government requirements remain under attorney control.

## Quick start

```bash
cd apps/web
cp .env.example .env
npm install
npm run setup
npm run dev
```

Open http://localhost:3000

**Demo staff login:** `admin@harbor.example` / `password123`  
Also: `attorney@harbor.example`, `paralegal@harbor.example` (same password).

## Stack

- Next.js + TypeScript + Tailwind (minimal UI)
- Prisma + SQLite (swap to PostgreSQL in production)
- REST `/api/v1` as specified in the product document
- Local object storage + in-process job table (scan → extract → completeness)
- Heuristic OCR/classification/summaries with source citations (provider-swappable)

## Apps

| Path | Audience |
| --- | --- |
| `/` `/pricing` | Marketing |
| `/signup` `/login` | Firm auth |
| `/app/cases` | Staff workspace |
| `/portal/[token]` | Client magic link + OTP |

See `docs/architecture/overview.md`, `docs/api/openapi.yaml`, and `docs/runbooks/operations.md`.
