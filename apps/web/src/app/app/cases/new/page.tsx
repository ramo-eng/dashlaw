import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { PageTitle } from "@/components/ui";
import { CreateCaseForm } from "@/components/create-case-form";

export default async function NewCasePage() {
  const { session } = await requireStaffPage();
  const [clients, templates, users] = await Promise.all([
    prisma.client.findMany({ where: { firmId: session.firmId, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.caseTemplate.findMany({
      where: { firmId: session.firmId, status: "published" },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { firmId: session.firmId, deletedAt: null } }),
  ]);
  return (
    <div>
      <PageTitle title="Create case" />
      <p className="mb-4 max-w-xl text-sm text-[var(--muted)]">
        Selecting a published template instantiates its checklist and intake questions. Existing cases keep the version
        they were created with.
      </p>
      <CreateCaseForm
        clients={clients.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          caseType: t.caseType,
          version: t.version,
        }))}
        owners={users.map((u) => ({ id: u.id, name: u.name }))}
        currentUserId={session.userId}
      />
    </div>
  );
}
