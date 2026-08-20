import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, Empty, Notice, PageTitle, statusTone } from "@/components/ui";
import { toFirmLocal } from "@/lib/domain/time";
import { TickJobsButton } from "@/components/case-actions";

export default async function DeadlinesPage() {
  const { session, firm } = await requireStaffPage();
  const deadlines = await prisma.deadline.findMany({
    where: { case: { firmId: session.firmId } },
    include: { case: { include: { client: true } } },
    orderBy: { dueAt: "asc" },
  });
  return (
    <div>
      <PageTitle title="Deadlines" actions={<TickJobsButton />} />
      <Notice>
        Times are shown in {firm.timezone}. Stored values are UTC. Critical deadlines must be confirmed by a user.
      </Notice>
      {deadlines.length === 0 ? (
        <Empty>No deadlines recorded.</Empty>
      ) : (
        <table className="rounded border border-[var(--line)] bg-white">
          <thead>
            <tr>
              <th>Title</th>
              <th>Case</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {deadlines.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td>
                  <Link href={`/app/cases/${d.caseId}?tab=deadlines`}>{d.case.title}</Link>
                </td>
                <td>{toFirmLocal(d.dueAt, d.timezone || firm.timezone)}</td>
                <td>
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
