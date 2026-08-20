import Link from "next/link";
import { Footer, PublicNav } from "@/components/ui";

export default function LandingPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-sm text-[var(--muted)]">For immigration law firms · 1–50 staff</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-tight">
          One case. One workspace. Documents collected without the chase.
        </h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">
          DashLaw centralizes intake, checklists, client uploads, reminders, deadlines, and assistive document
          review. Legal judgment stays with the attorney.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/signup" className="rounded bg-[var(--navy)] px-4 py-2 text-white no-underline">
            Start a demo firm
          </Link>
          <Link href="/pricing" className="rounded border border-[var(--line)] bg-white px-4 py-2 no-underline">
            View pricing
          </Link>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["Cases + checklists", "Instantiate a template, track readiness, and keep a single source of truth."],
            ["Client portal", "Magic link + OTP. Clients only see their case, requested items, and progress."],
            ["Reminders & AI assist", "Auditable reminders, extraction with confidence, source-backed summaries."],
          ].map(([t, d]) => (
            <div key={t} className="rounded border border-[var(--line)] bg-white p-4">
              <h2 className="font-medium">{t}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm">
          Demo login after seed: <code>admin@harbor.example</code> / <code>password123</code>
        </p>
      </main>
      <Footer />
    </div>
  );
}
