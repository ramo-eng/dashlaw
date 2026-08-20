import Link from "next/link";
import { Footer, PublicNav } from "@/components/ui";

const plans = [
  { name: "Trial", price: "$0", detail: "1 firm, 5 seats, 20 cases. AI on with watermarks." },
  { name: "Practice", price: "$149/mo", detail: "Unlimited cases for small firms, reminders, portal, audit log." },
  { name: "Firm", price: "$399/mo", detail: "Templates versioning, MFA required, retention controls, more seats." },
];

export default function PricingPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="mt-2 text-[var(--muted)]">Simple plans. Billing is stubbed in this build (no live Stripe charges).</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className="rounded border border-[var(--line)] bg-white p-5">
              <h2 className="text-lg font-medium">{p.name}</h2>
              <p className="mt-2 text-2xl">{p.price}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{p.detail}</p>
              <Link href="/signup" className="mt-4 inline-block text-sm">
                Start trial →
              </Link>
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-lg font-medium">FAQ</h2>
        <dl className="mt-4 max-w-2xl space-y-4 text-sm">
          <div>
            <dt className="font-medium">Is this legal advice?</dt>
            <dd className="text-[var(--muted)]">No. DashLaw is administrative workflow software. Attorneys remain responsible for legal conclusions.</dd>
          </div>
          <div>
            <dt className="font-medium">Where are files stored?</dt>
            <dd className="text-[var(--muted)]">Originals are stored as immutable versions outside the database. Extracted AI data is stored separately.</dd>
          </div>
        </dl>
      </main>
      <Footer />
    </div>
  );
}
