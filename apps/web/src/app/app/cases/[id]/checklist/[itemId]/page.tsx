import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, Card, statusTone } from "@/components/ui";
import { ItemActions, UploadForm } from "@/components/case-actions";
import { toFirmLocal } from "@/lib/domain/time";

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { session, firm } = await requireStaffPage();
  const { id, itemId } = await params;
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, case: { id, firmId: session.firmId } },
    include: { documents: true, case: true },
  });
  if (!item) notFound();
  return (
    <div>
      <div className="text-sm text-[var(--muted)]">
        <Link href={`/app/cases/${id}?tab=checklist`}>Back to case</Link>
      </div>
      <h1 className="mt-2 text-xl font-semibold">{item.title}</h1>
      <div className="mt-2 flex gap-2">
        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
        <Badge>{item.required ? "Required" : "Optional"}</Badge>
      </div>
      <Card className="mt-4">
        <div className="text-xs text-[var(--muted)]">Instructions</div>
        <p>{item.instructions}</p>
        <p className="mt-2 text-sm">Allowed types: {item.allowedTypes}</p>
        <p className="text-sm">Due: {item.dueAt ? toFirmLocal(item.dueAt, firm.timezone) : "—"}</p>
        {item.waiveReason && <p className="text-sm">Waive reason: {item.waiveReason}</p>}
        <ItemActions itemId={item.id} />
      </Card>
      <h2 className="mt-6 font-medium">Versions</h2>
      <UploadForm caseId={item.caseId} checklistItemId={item.id} />
      <ul className="mt-3 grid gap-2">
        {item.documents.map((d) => (
          <li key={d.id} className="rounded border border-[var(--line)] bg-white p-3 text-sm">
            <Link href={`/app/cases/${id}/documents/${d.id}`}>
              {d.originalName} v{d.version}
            </Link>{" "}
            · {d.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
