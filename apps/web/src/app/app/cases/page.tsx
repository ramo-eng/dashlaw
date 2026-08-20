import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, Empty, PageTitle, statusTone } from "@/components/ui";
import { calculateReadiness } from "@/lib/domain/checklist";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { session } = await requireStaffPage();
  const sp = await searchParams;
  const cases = await prisma.case.findMany({
    where: {
      firmId: session.firmId,
      deletedAt: null,
      status: sp.status || undefined,
      OR: sp.q
        ? [
            { title: { contains: sp.q } },
            { caseType: { contains: sp.q } },
            { client: { name: { contains: sp.q } } },
          ]
        : undefined,
    },
    include: { client: true, owner: true, checklistItems: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageTitle
        title="Cases"
        actions={
          <Link href="/app/cases/new" className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white no-underline">
            New case
          </Link>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" placeholder="Search client or case" defaultValue={sp.q} className="max-w-xs" />
        <select name="status" defaultValue={sp.status || ""} className="max-w-[160px]">
          <option value="">All statuses</option>
          {["Draft", "Intake", "Collecting", "Review", "Ready", "Filed", "Closed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="rounded border border-[var(--line)] bg-white px-3 py-2 text-sm">Filter</button>
      </form>
      {cases.length === 0 ? (
        <Empty>No cases yet. Create a client and case from a template.</Empty>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--line)] bg-white">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Client</th>
                <th>Type</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Ready</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/app/cases/${c.id}`}>{c.title}</Link>
                  </td>
                  <td>{c.client.name}</td>
                  <td>{c.caseType}</td>
                  <td>
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </td>
                  <td>{c.owner.name}</td>
                  <td>{calculateReadiness(c.checklistItems)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
