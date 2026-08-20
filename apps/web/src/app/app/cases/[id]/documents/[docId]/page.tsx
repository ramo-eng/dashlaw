import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, Card, Notice, statusTone } from "@/components/ui";

export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { session } = await requireStaffPage();
  const { id, docId } = await params;
  const doc = await prisma.document.findFirst({
    where: { id: docId, caseId: id, firmId: session.firmId },
    include: { extractions: { orderBy: { createdAt: "desc" } } },
  });
  if (!doc) notFound();
  const latest = doc.extractions[0];
  const fields = latest ? JSON.parse(latest.payload).fields ?? [] : [];
  return (
    <div>
      <div className="text-sm text-[var(--muted)]">
        <Link href={`/app/cases/${id}?tab=documents`}>Back to case</Link>
      </div>
      <h1 className="mt-2 text-xl font-semibold">{doc.originalName}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
        <Badge>{doc.type}</Badge>
        <Badge>v{doc.version}</Badge>
        <Badge>{doc.visibility}</Badge>
      </div>
      <p className="mt-2 text-sm">
        Scan: {doc.scanStatus} {doc.scanResult ? `(${doc.scanResult})` : ""}
      </p>
      <p className="text-sm">
        <a href={`/api/files/${doc.id}`}>Download original</a>
      </p>
      <Notice>
        Extracted values are stored separately from the original file and must be confirmed by staff before being treated
        as case facts.
      </Notice>
      {latest ? (
        <Card>
          <div className="text-sm">Classifier: {latest.classifier} · confidence {latest.confidence}</div>
          {latest.needsReview && <p className="text-sm text-[var(--warn)]">Flagged for human review.</p>}
          {latest.error && <p className="text-sm text-[var(--bad)]">{latest.error}</p>}
          <ul className="mt-2 text-sm">
            {fields.map((f: { key: string; value: string | null; confidence: number }) => (
              <li key={f.key}>
                {f.key}: {f.value ?? "missing"} ({f.confidence})
              </li>
            ))}
          </ul>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap bg-[#f7f7f4] p-2 text-xs">
            {latest.ocrText}
          </pre>
        </Card>
      ) : (
        <p className="text-sm text-[var(--muted)]">Processing has not produced extraction yet.</p>
      )}
    </div>
  );
}
