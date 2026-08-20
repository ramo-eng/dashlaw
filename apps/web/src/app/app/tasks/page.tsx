import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, Empty, PageTitle, statusTone } from "@/components/ui";

export default async function TasksPage() {
  const { session } = await requireStaffPage();
  const tasks = await prisma.task.findMany({
    where: { case: { firmId: session.firmId } },
    include: { case: { include: { client: true } }, assignee: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageTitle title="Tasks" />
      {tasks.length === 0 ? (
        <Empty>No staff tasks yet. Create them from a case workspace.</Empty>
      ) : (
        <table className="rounded border border-[var(--line)] bg-white">
          <thead>
            <tr>
              <th>Task</th>
              <th>Case</th>
              <th>Assignee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>
                  <Link href={`/app/cases/${t.caseId}`}>{t.case.client.name}</Link>
                </td>
                <td>{t.assignee?.name ?? "Unassigned"}</td>
                <td>
                  <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
