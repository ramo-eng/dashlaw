import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, Card, statusTone } from "@/components/ui";
import { PublishButton } from "@/components/template-forms";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session } = await requireStaffPage();
  const { id } = await params;
  const t = await prisma.caseTemplate.findFirst({
    where: { id, firmId: session.firmId },
    include: { items: { orderBy: { sortOrder: "asc" } }, questions: { orderBy: { sortOrder: "asc" } } },
  });
  if (!t) notFound();
  return (
    <div>
      <h1 className="text-xl font-semibold">{t.name}</h1>
      <div className="mt-2 flex gap-2">
        <Badge>{t.caseType}</Badge>
        <Badge tone={statusTone(t.status)}>{t.status}</Badge>
        <Badge>v{t.version}</Badge>
      </div>
      <div className="mt-4">
        <PublishButton id={t.id} />
      </div>
      <h2 className="mt-6 font-medium">Checklist</h2>
      <div className="grid gap-2">
        {t.items.map((i) => (
          <Card key={i.id}>
            <div className="font-medium">{i.title}</div>
            <p className="text-sm text-[var(--muted)]">{i.instructions}</p>
          </Card>
        ))}
      </div>
      <h2 className="mt-6 font-medium">Intake questions</h2>
      <ul className="list-disc pl-5 text-sm">
        {t.questions.map((q) => (
          <li key={q.id}>{q.prompt}</li>
        ))}
      </ul>
    </div>
  );
}
