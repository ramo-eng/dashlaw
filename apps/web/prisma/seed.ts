import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedFirmTemplates, createCaseFromTemplate } from "../src/lib/cases";
import { storeOriginal } from "../src/lib/storage";
import { enqueueJob, processDueJobs } from "../src/lib/jobs";

const prisma = new PrismaClient();

async function main() {
  await prisma.job.deleteMany();
  await prisma.completenessResult.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aISummary.deleteMany();
  await prisma.documentExtraction.deleteMany();
  await prisma.document.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.intakeResponse.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deadline.deleteMany();
  await prisma.clientInvite.deleteMany();
  await prisma.case.deleteMany();
  await prisma.templateQuestion.deleteMany();
  await prisma.templateItem.deleteMany();
  await prisma.caseTemplate.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  await prisma.firm.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const firm = await prisma.firm.create({
    data: {
      name: "Harbor Immigration",
      timezone: "America/Los_Angeles",
      onboardingComplete: true,
      planId: "trial",
      subscription: { create: { plan: "trial", status: "trialing", seats: 8 } },
    },
  });
  const admin = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: "admin@harbor.example",
      name: "Amina Shah",
      role: "FIRM_ADMIN",
      status: "active",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  const attorney = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: "attorney@harbor.example",
      name: "Daniel Park",
      role: "ATTORNEY",
      status: "active",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.user.create({
    data: {
      firmId: firm.id,
      email: "paralegal@harbor.example",
      name: "Sofia Alvarez",
      role: "PARALEGAL",
      status: "active",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  await seedFirmTemplates(firm.id);
  const client = await prisma.client.create({
    data: {
      firmId: firm.id,
      name: "Wei Chen",
      email: "wei.chen@example.com",
      status: "active",
    },
  });
  const template = await prisma.caseTemplate.findFirstOrThrow({
    where: { firmId: firm.id, caseType: "H-1B", status: "published" },
  });
  const caseRow = await createCaseFromTemplate({
    firmId: firm.id,
    clientId: client.id,
    ownerId: attorney.id,
    title: "Chen — H-1B cap FY27",
    caseType: "H-1B",
    templateId: template.id,
  });
  await prisma.case.update({ where: { id: caseRow.id }, data: { status: "Collecting" } });
  const passportItem = await prisma.checklistItem.findFirstOrThrow({
    where: { caseId: caseRow.id, title: { contains: "Passport" } },
  });
  await prisma.checklistItem.update({
    where: { id: passportItem.id },
    data: { status: "Requested" },
  });
  const text = "Name: Wei Chen\nDate of birth: 1992-04-11\nPassport: C12345678\n";
  const buf = Buffer.from(text, "utf8");
  const docId = crypto.randomUUID();
  const storageKey = await storeOriginal(buf, "passport.txt", docId, 1, "text/plain");
  await prisma.document.create({
    data: {
      id: docId,
      caseId: caseRow.id,
      checklistItemId: passportItem.id,
      firmId: firm.id,
      originalName: "passport.txt",
      storageKey,
      mimeType: "text/plain",
      sizeBytes: buf.length,
      status: "Uploading",
      version: 1,
    },
  });
  await prisma.checklistItem.update({ where: { id: passportItem.id }, data: { status: "Submitted" } });
  await enqueueJob("document.scan", { documentId: docId });
  await processDueJobs(10);
  await prisma.deadline.create({
    data: {
      caseId: caseRow.id,
      title: "Internal completeness review",
      type: "operational",
      dueAt: new Date(Date.now() + 5 * 86400000),
      source: "manual",
      timezone: firm.timezone,
      critical: false,
    },
  });
  await prisma.auditEvent.create({
    data: {
      firmId: firm.id,
      actorId: admin.id,
      action: "seed_completed",
      targetType: "firm",
      targetId: firm.id,
      metadata: "{}",
    },
  });
  console.log("Seeded Harbor Immigration");
  console.log("Staff: admin@harbor.example / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
