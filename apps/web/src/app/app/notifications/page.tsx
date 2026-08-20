import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, PageTitle, statusTone } from "@/components/ui";
import { TickJobsButton } from "@/components/case-actions";

export default async function NotificationsPage() {
  const { session, firm } = await requireStaffPage();
  const notes = await prisma.notification.findMany({
    where: { firmId: session.firmId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <PageTitle title="Notifications" actions={<TickJobsButton />} />
      <p className="mb-4 text-sm text-[var(--muted)]">
        Default reminder cadence: every {firm.reminderCadenceDays} days. Every send is stored and audited. Emails are
        delivered to the console provider in this environment.
      </p>
      <table className="rounded border border-[var(--line)] bg-white">
        <thead>
          <tr>
            <th>When</th>
            <th>Type</th>
            <th>To</th>
            <th>Status</th>
            <th>Subject</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((n) => (
            <tr key={n.id}>
              <td className="whitespace-nowrap text-xs">{n.createdAt.toISOString()}</td>
              <td>{n.type}</td>
              <td>{n.recipientEmail}</td>
              <td>
                <Badge tone={statusTone(n.status)}>{n.status}</Badge>
              </td>
              <td>{n.subject}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
