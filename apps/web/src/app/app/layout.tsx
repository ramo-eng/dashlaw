import Link from "next/link";
import { requireStaffPage } from "@/lib/page-auth";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

const NAV = [
  ["Cases", "/app/cases"],
  ["Tasks", "/app/tasks"],
  ["Deadlines", "/app/deadlines"],
  ["Templates", "/app/templates"],
  ["Users", "/app/users"],
  ["Notifications", "/app/notifications"],
  ["Billing", "/app/billing"],
  ["Audit log", "/app/audit"],
  ["Settings", "/app/settings"],
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { session, firm } = await requireStaffPage();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-[var(--line)] bg-white md:border-b-0 md:border-r">
        <div className="px-4 py-4">
          <div className="font-semibold text-[var(--navy)]">DashLaw</div>
          <div className="truncate text-xs text-[var(--muted)]">{firm.name}</div>
        </div>
        <nav className="flex flex-wrap gap-2 px-3 pb-4 md:flex-col md:gap-0">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1.5 text-sm no-underline hover:bg-[#f4f4f1]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 pb-2">
          <LogoutButton />
        </div>
        <p className="px-4 pb-4 text-xs text-[var(--muted)]">
          {session.name} · {session.role.replaceAll("_", " ")}
        </p>
      </aside>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}
