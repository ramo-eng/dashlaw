import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { PageTitle } from "@/components/ui";

export default async function AuditPage() {
  const { session } = await requireStaffPage();
  const events = await prisma.auditEvent.findMany({
    where: { firmId: session.firmId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <PageTitle title="Audit log" />
      <p className="mb-4 text-sm text-[var(--muted)]">Append-only. Includes auth, document access, AI, and role changes.</p>
      <div className="overflow-x-auto rounded border border-[var(--line)] bg-white">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Target</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap text-xs">{e.createdAt.toISOString()}</td>
                <td>{e.action}</td>
                <td>
                  {e.targetType} {e.targetId.slice(0, 8)}
                </td>
                <td>{e.actorType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
