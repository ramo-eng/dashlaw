import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, PageTitle, statusTone } from "@/components/ui";
import { TemplateCreateForm } from "@/components/template-forms";

export default async function TemplatesPage() {
  const { session } = await requireStaffPage();
  const templates = await prisma.caseTemplate.findMany({
    where: { firmId: session.firmId },
    include: { items: true, questions: true },
    orderBy: [{ familyId: "asc" }, { version: "desc" }],
  });
  return (
    <div>
      <PageTitle title="Case templates" />
      <p className="mb-4 max-w-2xl text-sm text-[var(--muted)]">
        Published templates are versioned. Editing a published template creates a new version; existing cases keep the
        instantiated copy.
      </p>
      <TemplateCreateForm />
      <table className="mt-6 rounded border border-[var(--line)] bg-white">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Version</th>
            <th>Status</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>
                <Link href={`/app/templates/${t.id}`}>{t.name}</Link>
              </td>
              <td>{t.caseType}</td>
              <td>v{t.version}</td>
              <td>
                <Badge tone={statusTone(t.status)}>{t.status}</Badge>
              </td>
              <td>
                {t.items.length} / {t.questions.length} questions
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
