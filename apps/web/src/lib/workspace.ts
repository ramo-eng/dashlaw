import { prisma } from "./db";
import { calculateReadiness, nextChecklistAction } from "./domain/checklist";

export async function refreshCaseProgress(caseId: string) {
  const items = await prisma.checklistItem.findMany({ where: { caseId } });
  const readiness = calculateReadiness(items);
  const nextAction = nextChecklistAction(items);
  await prisma.case.update({
    where: { id: caseId },
    data: { nextAction },
  });
  return readiness;
}

export async function getCaseWorkspace(firmId: string, caseId: string) {
  const row = await prisma.case.findFirst({
    where: { id: caseId, firmId, deletedAt: null },
    include: {
      client: true,
      owner: true,
      checklistItems: { orderBy: { sortOrder: "asc" }, include: { documents: true } },
      documents: { orderBy: [{ createdAt: "desc" }] },
      intakeResponses: { orderBy: { fieldKey: "asc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      deadlines: { orderBy: { dueAt: "asc" } },
      aiSummaries: { orderBy: { version: "desc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!row) return null;
  const readiness = calculateReadiness(row.checklistItems);
  const completeness = await prisma.completenessResult.findFirst({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });
  const activity = await prisma.auditEvent.findMany({
    where: { firmId, targetId: caseId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { ...row, readiness, completeness, activity };
}
