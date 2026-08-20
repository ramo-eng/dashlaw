import { prisma } from "./db";
import { classifyDocument, extractFields } from "./domain/ai";
import { evaluateCompleteness } from "./domain/completeness";
import { looksMalicious, readStored } from "./storage";
import { audit } from "./audit";

export async function enqueueJob(type: string, payload: unknown, runAfter = new Date()) {
  const job = await prisma.job.create({
    data: { type, payload: JSON.stringify(payload), runAfter },
  });
  void processJob(job.id);
  return job;
}

export async function processDueJobs(limit = 20) {
  const jobs = await prisma.job.findMany({
    where: { status: { in: ["queued", "retry"] }, runAfter: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  for (const job of jobs) {
    await processJob(job.id);
  }
  return jobs.length;
}

export async function processJob(id: string) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || !["queued", "retry"].includes(job.status)) return;
  await prisma.job.update({
    where: { id },
    data: { status: "running", attempts: { increment: 1 } },
  });
  try {
    const payload = JSON.parse(job.payload);
    if (job.type === "document.scan") await scanDocument(payload.documentId);
    else if (job.type === "document.extract") await extractDocument(payload.documentId);
    else if (job.type === "document.completeness") await completenessForCase(payload.caseId);
    else if (job.type === "notification.reminders") await runReminderSweep();
    else if (job.type === "deadline.remind") await remindDeadlines();
    await prisma.job.update({ where: { id }, data: { status: "done", lastError: null } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "job failed";
    const attempts = job.attempts + 1;
    const retry = attempts < 5;
    await prisma.job.update({
      where: { id },
      data: {
        status: retry ? "retry" : "dead",
        lastError: message,
        runAfter: new Date(Date.now() + Math.min(60_000 * 2 ** attempts, 30 * 60_000)),
      },
    });
  }
}

async function scanDocument(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;
  const buf = await readStored(doc.storageKey);
  if (looksMalicious(doc.originalName, buf)) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "Quarantined", scanStatus: "rejected", scanResult: "malware_signature" },
    });
    await audit({
      firmId: doc.firmId,
      actorType: "system",
      action: "document_quarantined",
      targetType: "document",
      targetId: doc.id,
    });
    return;
  }
  await prisma.document.update({
    where: { id: documentId },
    data: { scanStatus: "clean", scanResult: "clean", status: "Processing" },
  });
  await enqueueJob("document.extract", { documentId });
}

async function extractDocument(documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { checklistItem: true },
  });
  if (!doc) return;
  const firm = await prisma.firm.findUnique({ where: { id: doc.firmId } });
  const buf = await readStored(doc.storageKey);
  let text = "";
  try {
    text = buf.toString("utf8");
    if (text.includes("\u0000")) text = "";
  } catch {
    text = "";
  }
  if (!text.trim()) {
    text = `OCR placeholder for ${doc.originalName}. Filename used for classification when text is unavailable.`;
  }
  const classified = classifyDocument(doc.originalName, text);
  const fields = extractFields(classified.type, `${doc.originalName}\n${text}`);
  const needsReview = classified.confidence < 0.7 || fields.some((f) => f.confidence < 0.7);
  await prisma.documentExtraction.create({
    data: {
      documentId,
      confidence: classified.confidence,
      payload: JSON.stringify({ fields }),
      classifier: classified.type,
      ocrText: text.slice(0, 8000),
      needsReview,
      modelVersion: firm?.aiEnabled ? "heuristic-v1" : "disabled",
    },
  });
  await prisma.document.update({
    where: { id: documentId },
    data: {
      type: classified.type,
      status: needsReview ? "Needs Review" : "Ready",
    },
  });
  await enqueueJob("document.completeness", { caseId: doc.caseId });
}

async function completenessForCase(caseId: string) {
  const items = await prisma.checklistItem.findMany({
    where: { caseId },
    include: { documents: { include: { extractions: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  const findings = items.flatMap((item) => {
    const latest = item.documents.sort((a, b) => b.version - a.version)[0];
    const extraction = latest?.extractions[0];
    const fields = extraction ? (JSON.parse(extraction.payload).fields ?? []) : [];
    return evaluateCompleteness({
      itemTitle: item.title,
      required: item.required,
      status: item.status,
      expectedFields: JSON.parse(item.expectedSchema || "[]"),
      extracted: fields,
    });
  });
  await prisma.completenessResult.create({
    data: { caseId, findings: JSON.stringify(findings) },
  });
}

export async function runReminderSweep() {
  const now = new Date();
  const items = await prisma.checklistItem.findMany({
    where: {
      remindersPaused: false,
      status: { in: ["Not Started", "Requested", "Needs Replacement"] },
      OR: [{ nextReminderAt: { lte: now } }, { nextReminderAt: null, dueAt: { lte: now } }],
    },
    include: { case: { include: { client: true, firm: true } } },
  });
  for (const item of items) {
    if (["Closed", "Filed"].includes(item.case.status)) continue;
    const cadence = item.case.firm.reminderCadenceDays;
    const key = `reminder:${item.id}:${now.toISOString().slice(0, 10)}`;
    const { sendEmail } = await import("./email");
    await sendEmail({
      firmId: item.case.firmId,
      caseId: item.caseId,
      recipientEmail: item.case.client.email,
      type: "checklist_reminder",
      subject: `Reminder: ${item.title} still needed`,
      body: `This is an administrative reminder for ${item.case.title}. Please upload: ${item.title}.`,
      idempotencyKey: key,
    });
    await prisma.checklistItem.update({
      where: { id: item.id },
      data: {
        lastRemindedAt: now,
        nextReminderAt: new Date(now.getTime() + cadence * 86400000),
      },
    });
  }
}

async function remindDeadlines() {
  const soon = new Date(Date.now() + 3 * 86400000);
  const deadlines = await prisma.deadline.findMany({
    where: { status: "open", dueAt: { lte: soon } },
    include: { case: { include: { owner: true } } },
  });
  for (const d of deadlines) {
    const { sendEmail } = await import("./email");
    await sendEmail({
      firmId: d.case.firmId,
      caseId: d.caseId,
      recipientId: d.case.ownerId,
      recipientEmail: d.case.owner.email,
      type: "deadline_reminder",
      subject: `Deadline approaching: ${d.title}`,
      body: `Deadline "${d.title}" for ${d.case.title} is due ${d.dueAt.toISOString()}. Confirm in the workspace. Inferred legal deadlines are not authoritative.`,
      idempotencyKey: `deadline:${d.id}:${d.dueAt.toISOString().slice(0, 10)}`,
    });
  }
}
