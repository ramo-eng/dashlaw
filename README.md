# DashLaw

Immigration case-management SaaS for law firms: cases, checklists, client portal, reminders, document processing, completeness checks, AI summaries, deadlines, and templates.

This product is **administrative workflow software**, not legal advice. Eligibility, filing strategy, and representations about government requirements remain under attorney control.

## Run locally (from Cursor / VS Code)

1. Open this repository folder as the workspace.
2. Use **Run and Debug** (Ctrl/Cmd+Shift+D) → **DashLaw: Run locally**.
3. Or **Terminal → Run Task…** → **DashLaw: Start local server**.

The first run installs dependencies, creates `apps/web/.env`, pushes the SQLite database, and seeds demo data if the database is empty. It then serves the app at **http://localhost:3000** and opens the browser when Next.js is ready.

From a terminal in the repo root:

```bash
npm run local
```

(`npm run setup` prepares the database without starting the server.)

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
