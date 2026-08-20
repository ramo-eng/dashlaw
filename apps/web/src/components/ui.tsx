import Link from "next/link";

export function PublicNav() {
  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-[var(--navy)] no-underline">
          DashLaw
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup" className="rounded bg-[var(--navy)] px-3 py-1.5 text-white no-underline">
            Start trial
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] px-4 py-8 text-center text-xs text-[var(--muted)]">
      DashLaw is administrative workflow software. It does not provide legal advice, eligibility determinations, or
      filing strategy. Qualified attorney review is required.
    </footer>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded border border-[var(--line)] bg-white p-4 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" }) {
  const map = {
    neutral: "bg-[#eee] text-[#333]",
    ok: "bg-[#e7f4ec] text-[var(--ok)]",
    warn: "bg-[#f8efd8] text-[var(--warn)]",
    bad: "bg-[#f8e3e3] text-[var(--bad)]",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${map[tone]}`}>{children}</span>
  );
}

export function statusTone(status: string): "neutral" | "ok" | "warn" | "bad" {
  if (["Accepted", "Ready", "active", "approved", "Filed", "clean"].includes(status)) return "ok";
  if (["Needs Replacement", "Needs Review", "Quarantined", "past_due", "dead"].includes(status)) return "bad";
  if (["Requested", "Submitted", "Collecting", "Draft", "Processing"].includes(status)) return "warn";
  return "neutral";
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded bg-[var(--navy)] px-3 py-2 text-sm text-white disabled:opacity-50 ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-sm text-[var(--muted)]">{children}</p>;
}

export function PageTitle({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">{title}</h1>
      {actions}
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded border border-[#ead9a8] bg-[#fbf6e9] px-3 py-2 text-sm text-[var(--warn)]">
      {children}
    </div>
  );
}
