import { requireClientPage } from "@/lib/page-auth";
import { getCaseWorkspace } from "@/lib/workspace";
import { Badge, Card, statusTone } from "@/components/ui";
import { PortalIntake, PortalUpload } from "@/components/portal-actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortalCasePage() {
  const session = await requireClientPage();
  const ws = await getCaseWorkspace(session.firmId, session.caseId);
  if (!ws) notFound();
  const items = ws.checklistItems.map((i) => ({
    ...i,
    documents: i.documents.filter((d) => d.visibility !== "staff"),
  }));
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{ws.title}</h1>
      <p className="text-sm text-[var(--muted)]">
        {ws.client.name} · {ws.caseType}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-[var(--muted)]">Progress</div>
          <div className="text-2xl font-semibold">{ws.readiness}%</div>
        </Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">Status</div>
          <Badge tone={statusTone(ws.status)}>{ws.status}</Badge>
        </Card>
      </div>
      <h2 className="mt-8 font-medium">Intake</h2>
      <PortalIntake answers={ws.intakeResponses} />
      <h2 className="mt-8 font-medium">Requested documents</h2>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{item.title}</div>
                <p className="text-sm text-[var(--muted)]">{item.instructions}</p>
              </div>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            </div>
            <p className="mt-1 text-xs">Allowed: {item.allowedTypes}</p>
            <ul className="mt-2 text-sm">
              {item.documents.map((d) => (
                <li key={d.id}>
                  {d.originalName} v{d.version} · {d.status}
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <PortalUpload caseId={ws.id} checklistItemId={item.id} />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
