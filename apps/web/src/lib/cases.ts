import { prisma } from "./db";
import { DEFAULT_TEMPLATES } from "./default-templates";
import { randomUUID } from "crypto";

export async function seedFirmTemplates(firmId: string) {
  const existing = await prisma.caseTemplate.count({ where: { firmId } });
  if (existing > 0) return;
  for (const tpl of DEFAULT_TEMPLATES) {
    const familyId = randomUUID();
    await prisma.caseTemplate.create({
      data: {
        firmId,
        name: tpl.name,
        caseType: tpl.caseType,
        version: 1,
        status: "published",
        familyId,
        publishedAt: new Date(),
        reminderDefaults: JSON.stringify(tpl.reminderDefaults),
        items: {
          create: tpl.items.map((item, idx) => ({
            title: item.title,
            required: item.required,
            instructions: item.instructions,
            allowedTypes: item.allowedTypes,
            dueOffsetDays: item.dueOffsetDays,
            expectedSchema: JSON.stringify(item.expectedSchema),
            sortOrder: idx,
          })),
        },
        questions: {
          create: tpl.questions.map((q, idx) => ({
            prompt: q.prompt,
            fieldKey: q.fieldKey,
            required: q.required,
            inputType: q.inputType,
            sortOrder: idx,
          })),
        },
      },
    });
  }
}

export async function createCaseFromTemplate(input: {
  firmId: string;
  clientId: string;
  ownerId: string;
  title: string;
  caseType: string;
  templateId: string;
}) {
  const template = await prisma.caseTemplate.findFirst({
    where: { id: input.templateId, firmId: input.firmId, status: "published" },
    include: { items: true, questions: true },
  });
  if (!template) throw new Error("Published template not found");

  const now = new Date();
  const caseRow = await prisma.case.create({
    data: {
      firmId: input.firmId,
      clientId: input.clientId,
      ownerId: input.ownerId,
      title: input.title,
      caseType: input.caseType || template.caseType,
      status: "Draft",
      templateId: template.id,
      templateVersion: template.version,
      nextAction: "Invite client and request documents",
    },
  });

  for (const item of template.items) {
    const due = new Date(now.getTime() + item.dueOffsetDays * 86400000);
    await prisma.checklistItem.create({
      data: {
        caseId: caseRow.id,
        templateItemId: item.id,
        title: item.title,
        required: item.required,
        instructions: item.instructions,
        allowedTypes: item.allowedTypes,
        ownerRole: item.ownerRole,
        status: "Not Started",
        dueAt: due,
        expectedSchema: item.expectedSchema,
        sortOrder: item.sortOrder,
      },
    });
  }

  for (const q of template.questions) {
    await prisma.intakeResponse.create({
      data: {
        caseId: caseRow.id,
        questionId: q.id,
        fieldKey: q.fieldKey,
        prompt: q.prompt,
        answer: "",
        required: q.required,
      },
    });
  }

  await prisma.task.create({
    data: {
      caseId: caseRow.id,
      assigneeId: input.ownerId,
      title: "Complete intake and send client portal invite",
      status: "open",
      visibility: "staff",
    },
  });

  return caseRow;
}

export async function publishTemplateVersion(templateId: string, firmId: string) {
  const current = await prisma.caseTemplate.findFirst({
    where: { id: templateId, firmId },
    include: { items: true, questions: true },
  });
  if (!current) throw new Error("Template not found");
  if (current.status === "published") {
    const next = await prisma.caseTemplate.create({
      data: {
        firmId,
        name: current.name,
        caseType: current.caseType,
        version: current.version + 1,
        status: "published",
        familyId: current.familyId,
        publishedAt: new Date(),
        reminderDefaults: current.reminderDefaults,
        items: {
          create: current.items.map((item) => ({
            title: item.title,
            required: item.required,
            instructions: item.instructions,
            allowedTypes: item.allowedTypes,
            ownerRole: item.ownerRole,
            sortOrder: item.sortOrder,
            dueOffsetDays: item.dueOffsetDays,
            expectedSchema: item.expectedSchema,
          })),
        },
        questions: {
          create: current.questions.map((q) => ({
            prompt: q.prompt,
            fieldKey: q.fieldKey,
            required: q.required,
            inputType: q.inputType,
            sortOrder: q.sortOrder,
          })),
        },
      },
    });
    await prisma.caseTemplate.update({
      where: { id: current.id },
      data: { status: "archived" },
    });
    return next;
  }
  return prisma.caseTemplate.update({
    where: { id: current.id },
    data: { status: "published", publishedAt: new Date() },
  });
}
