import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import {
  getClientSession,
  getStaffSession,
  hashPassword,
  hashToken,
  randomOtp,
  randomToken,
  requireClient,
  requireStaff,
  setClientSession,
  setStaffSession,
  verifyPassword,
  clearSessions,
} from "@/lib/auth";
import { audit, track } from "@/lib/audit";
import { hasPermission } from "@/lib/domain/roles";
import { assertCaseTransition } from "@/lib/domain/case-status";
import { canTransitionItem } from "@/lib/domain/checklist";
import { generateGroundedSummary } from "@/lib/domain/ai";
import { seedFirmTemplates, createCaseFromTemplate, publishTemplateVersion } from "@/lib/cases";
import { enqueueJob, processDueJobs } from "@/lib/jobs";
import { refreshCaseProgress, getCaseWorkspace } from "@/lib/workspace";
import { assertAllowedFile, newDocumentId, storeOriginal, readStored } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import type { StaffRole } from "@/lib/domain/roles";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ctx = { method: string; path: string[]; url: URL; req: Request; body: any; idempotency?: string };

function match(ctx: Ctx, method: string, parts: string[]) {
  if (ctx.method !== method || ctx.path.length !== parts.length) return false;
  return parts.every((p, i) => p.startsWith(":") || p === ctx.path[i]);
}

function param(ctx: Ctx, name: string, parts: string[]) {
  const idx = parts.findIndex((p) => p === `:${name}`);
  return ctx.path[idx];
}

async function readJson(req: Request) {
  const text = await req.text();
  if (!text) return {};
  return JSON.parse(text);
}

async function requirePerm(permission: Parameters<typeof hasPermission>[1]) {
  const { session, user } = await requireStaff();
  if (!hasPermission(session.role, permission)) {
    throw new HttpError(403, "Insufficient permissions");
  }
  return { session, user };
}

async function scopedCase(firmId: string, id: string) {
  const row = await prisma.case.findFirst({ where: { id, firmId, deletedAt: null } });
  if (!row) throw new HttpError(404, "Case not found");
  return row;
}

export async function handleApi(req: Request, path: string[]) {
  const url = new URL(req.url);
  const ctx: Ctx = {
    method: req.method,
    path,
    url,
    req,
    body: ["POST", "PATCH", "PUT"].includes(req.method) ? await readJson(req).catch(() => ({})) : {},
    idempotency: req.headers.get("Idempotency-Key") || undefined,
  };

  if (match(ctx, "GET", ["health"])) return { ok: true };

  if (match(ctx, "POST", ["auth", "signup"])) return signup(ctx);
  if (match(ctx, "POST", ["auth", "login"])) return login(ctx);
  if (match(ctx, "POST", ["auth", "logout"])) {
    await clearSessions();
    return { ok: true };
  }
  if (match(ctx, "POST", ["auth", "verify-email"])) return verifyEmail(ctx);
  if (match(ctx, "POST", ["auth", "forgot-password"])) return forgotPassword(ctx);
  if (match(ctx, "POST", ["auth", "reset-password"])) return resetPassword(ctx);
  if (match(ctx, "GET", ["me"])) return me();

  if (match(ctx, "POST", ["onboarding"])) return onboarding(ctx);
  if (match(ctx, "GET", ["clients"])) return listClients();
  if (match(ctx, "POST", ["clients"])) return createClient(ctx);

  if (match(ctx, "POST", ["cases"])) return createCase(ctx);
  if (match(ctx, "GET", ["cases"])) return listCases(ctx);
  if (match(ctx, "GET", ["cases", ":id"])) return getCase(ctx, param(ctx, "id", ["cases", ":id"]));
  if (match(ctx, "PATCH", ["cases", ":id"])) return patchCase(ctx, param(ctx, "id", ["cases", ":id"]));
  if (match(ctx, "POST", ["cases", ":id", "invite-client"]))
    return inviteClient(ctx, param(ctx, "id", ["cases", ":id", "invite-client"]));
  if (match(ctx, "GET", ["cases", ":id", "checklist"]))
    return getChecklist(param(ctx, "id", ["cases", ":id", "checklist"]));
  if (match(ctx, "POST", ["cases", ":id", "ai-summary"]))
    return generateSummary(ctx, param(ctx, "id", ["cases", ":id", "ai-summary"]));
  if (match(ctx, "POST", ["ai-summaries", ":id", "approve"]))
    return approveSummary(param(ctx, "id", ["ai-summaries", ":id", "approve"]));
  if (match(ctx, "GET", ["cases", ":id", "deadlines"]))
    return listDeadlines(param(ctx, "id", ["cases", ":id", "deadlines"]));

  if (match(ctx, "POST", ["checklist-items", ":id", "request"]))
    return requestItem(param(ctx, "id", ["checklist-items", ":id", "request"]));
  if (match(ctx, "PATCH", ["checklist-items", ":id"]))
    return patchItem(ctx, param(ctx, "id", ["checklist-items", ":id"]));

  if (match(ctx, "POST", ["documents", "presign"])) return presign(ctx);
  if (match(ctx, "POST", ["documents", "upload"])) return uploadDocument(ctx);
  if (match(ctx, "POST", ["documents", ":id", "complete"]))
    return completeUpload(param(ctx, "id", ["documents", ":id", "complete"]));
  if (match(ctx, "GET", ["documents", ":id"])) return getDocument(param(ctx, "id", ["documents", ":id"]));
  if (match(ctx, "POST", ["documents", ":id", "process"]))
    return retryProcess(param(ctx, "id", ["documents", ":id", "process"]));

  if (match(ctx, "POST", ["deadlines"])) return createDeadline(ctx);
  if (match(ctx, "PATCH", ["deadlines", ":id"])) return patchDeadline(ctx, param(ctx, "id", ["deadlines", ":id"]));

  if (match(ctx, "GET", ["templates"])) return listTemplates();
  if (match(ctx, "POST", ["templates"])) return createTemplate(ctx);
  if (match(ctx, "GET", ["templates", ":id"])) return getTemplate(param(ctx, "id", ["templates", ":id"]));
  if (match(ctx, "PATCH", ["templates", ":id"])) return patchTemplate(ctx, param(ctx, "id", ["templates", ":id"]));
  if (match(ctx, "POST", ["templates", ":id", "publish"]))
    return publishTemplate(param(ctx, "id", ["templates", ":id", "publish"]));

  if (match(ctx, "GET", ["audit-events"])) return auditEvents(ctx);
  if (match(ctx, "GET", ["tasks"])) return listTasks();
  if (match(ctx, "POST", ["tasks"])) return createTask(ctx);
  if (match(ctx, "PATCH", ["tasks", ":id"])) return patchTask(ctx, param(ctx, "id", ["tasks", ":id"]));
  if (match(ctx, "GET", ["users"])) return listUsers();
  if (match(ctx, "POST", ["users"])) return inviteUser(ctx);
  if (match(ctx, "PATCH", ["users", ":id"])) return patchUser(ctx, param(ctx, "id", ["users", ":id"]));
  if (match(ctx, "GET", ["settings"])) return getSettings();
  if (match(ctx, "PATCH", ["settings"])) return patchSettings(ctx);
  if (match(ctx, "GET", ["billing"])) return getBilling();
  if (match(ctx, "POST", ["billing", "checkout"])) return checkout(ctx);
  if (match(ctx, "POST", ["billing", "webhook"])) return billingWebhook(ctx);
  if (match(ctx, "GET", ["notifications"])) return listNotifications();
  if (match(ctx, "PATCH", ["notifications", "preferences"])) return notifPrefs(ctx);
  if (match(ctx, "POST", ["jobs", "tick"])) {
    const n = await processDueJobs();
    return { processed: n };
  }

  if (match(ctx, "POST", ["portal", "magic"])) return portalMagic(ctx);
  if (match(ctx, "POST", ["portal", "otp"])) return portalOtp(ctx);
  if (match(ctx, "GET", ["portal", "case"])) return portalCase();
  if (match(ctx, "POST", ["portal", "intake"])) return portalIntake(ctx);
  if (match(ctx, "POST", ["portal", "upload"])) return portalUpload(ctx);

  throw new HttpError(404, "Not found");
}

async function signup(ctx: Ctx) {
  const { firmName, name, email, password } = ctx.body;
  if (!firmName || !name || !email || !password) throw new HttpError(400, "Missing required field");
  const exists = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (exists) throw new HttpError(409, "An account with that email already exists");
  const passwordHash = await hashPassword(password);
  const firm = await prisma.firm.create({
    data: {
      name: firmName,
      subscription: { create: { plan: "trial", status: "trialing", seats: 5 } },
    },
  });
  const user = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: email.toLowerCase(),
      name,
      role: "FIRM_ADMIN",
      status: "pending_verification",
      passwordHash,
    },
  });
  await seedFirmTemplates(firm.id);
  const token = randomToken();
  await prisma.authToken.create({
    data: {
      purpose: "verify_email",
      email: user.email,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  await audit({ firmId: firm.id, actorId: user.id, action: "firm_created", targetType: "firm", targetId: firm.id });
  await track("firm_created", firm.id);
  return { firmId: firm.id, userId: user.id, verifyToken: token };
}

async function login(ctx: Ctx) {
  const { email, password } = ctx.body;
  const user = await prisma.user.findFirst({
    where: { email: email?.toLowerCase(), deletedAt: null },
  });
  if (!user || !(await verifyPassword(password || "", user.passwordHash))) {
    throw new HttpError(401, "Invalid credentials");
  }
  if (user.status === "deactivated") throw new HttpError(403, "Account deactivated");
  await setStaffSession({
    userId: user.id,
    firmId: user.firmId,
    role: user.role as StaffRole,
    email: user.email,
    name: user.name,
  });
  await audit({
    firmId: user.firmId,
    actorId: user.id,
    action: "login",
    targetType: "user",
    targetId: user.id,
  });
  return { ok: true, onboardingComplete: (await prisma.firm.findUnique({ where: { id: user.firmId } }))?.onboardingComplete };
}

async function verifyEmail(ctx: Ctx) {
  const token = await prisma.authToken.findFirst({
    where: { purpose: "verify_email", tokenHash: hashToken(ctx.body.token || ""), usedAt: null },
  });
  if (!token || token.expiresAt < new Date()) throw new HttpError(400, "Invalid or expired token");
  const user = await prisma.user.findFirst({ where: { email: token.email } });
  if (!user) throw new HttpError(400, "Invalid token");
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), status: "active" },
  });
  await prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
  return { ok: true };
}

async function forgotPassword(ctx: Ctx) {
  const email = ctx.body.email?.toLowerCase();
  const user = await prisma.user.findFirst({ where: { email } });
  const token = randomToken();
  if (user) {
    await prisma.authToken.create({
      data: {
        purpose: "reset_password",
        email,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
  }
  return { ok: true, resetToken: user ? token : undefined };
}

async function resetPassword(ctx: Ctx) {
  const token = await prisma.authToken.findFirst({
    where: { purpose: "reset_password", tokenHash: hashToken(ctx.body.token || ""), usedAt: null },
  });
  if (!token || token.expiresAt < new Date()) throw new HttpError(400, "Invalid or expired token");
  const user = await prisma.user.findFirst({ where: { email: token.email } });
  if (!user) throw new HttpError(400, "Invalid token");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(ctx.body.password) },
  });
  await prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
  return { ok: true };
}

async function me() {
  const staff = await getStaffSession();
  if (staff) {
    const firm = await prisma.firm.findUnique({ where: { id: staff.firmId } });
    return { type: "staff", ...staff, firm };
  }
  const client = await getClientSession();
  if (client) return { type: "client", ...client };
  throw new HttpError(401, "Authentication required");
}

async function onboarding(ctx: Ctx) {
  const { session } = await requirePerm("manageFirm");
  const firm = await prisma.firm.update({
    where: { id: session.firmId },
    data: {
      name: ctx.body.name ?? undefined,
      timezone: ctx.body.timezone ?? undefined,
      reminderCadenceDays: ctx.body.reminderCadenceDays
        ? Number(ctx.body.reminderCadenceDays)
        : undefined,
      aiEnabled:
        ctx.body.aiEnabled === undefined
          ? undefined
          : ctx.body.aiEnabled === true || ctx.body.aiEnabled === "true",
      onboardingComplete: true,
    },
  });
  return firm;
}

async function listClients() {
  const { session } = await requireStaff();
  return prisma.client.findMany({
    where: { firmId: session.firmId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

async function createClient(ctx: Ctx) {
  const { session } = await requirePerm("mutateCases");
  if (!ctx.body.name || !ctx.body.email) throw new HttpError(400, "Missing required field");
  return prisma.client.create({
    data: {
      firmId: session.firmId,
      name: ctx.body.name,
      email: ctx.body.email.toLowerCase(),
      phone: ctx.body.phone,
    },
  });
}

async function createCase(ctx: Ctx) {
  const { session } = await requirePerm("mutateCases");
  if (ctx.idempotency) {
    const hit = await prisma.idempotencyKey.findUnique({ where: { id: ctx.idempotency } });
    if (hit) return JSON.parse(hit.response);
  }
  if (!ctx.body.clientId || !ctx.body.templateId || !ctx.body.title) {
    throw new HttpError(400, "Missing required field");
  }
  const client = await prisma.client.findFirst({
    where: { id: ctx.body.clientId, firmId: session.firmId },
  });
  if (!client) throw new HttpError(400, "Client not found");
  const row = await createCaseFromTemplate({
    firmId: session.firmId,
    clientId: client.id,
    ownerId: ctx.body.ownerId || session.userId,
    title: ctx.body.title,
    caseType: ctx.body.caseType,
    templateId: ctx.body.templateId,
  });
  await audit({
    firmId: session.firmId,
    actorId: session.userId,
    action: "case_created",
    targetType: "case",
    targetId: row.id,
  });
  await track("case_created", session.firmId, { caseId: row.id });
  if (ctx.idempotency) {
    await prisma.idempotencyKey.create({
      data: { id: ctx.idempotency, response: JSON.stringify(row) },
    });
  }
  return row;
}

async function listCases(ctx: Ctx) {
  const { session } = await requireStaff();
  const q = ctx.url.searchParams.get("q")?.trim();
  const status = ctx.url.searchParams.get("status");
  return prisma.case.findMany({
    where: {
      firmId: session.firmId,
      deletedAt: null,
      status: status || undefined,
      OR: q
        ? [
            { title: { contains: q } },
            { caseType: { contains: q } },
            { client: { name: { contains: q } } },
            { client: { email: { contains: q } } },
          ]
        : undefined,
    },
    include: { client: true, owner: true, checklistItems: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function getCase(_ctx: Ctx, id: string) {
  const { session } = await requireStaff();
  const ws = await getCaseWorkspace(session.firmId, id);
  if (!ws) throw new HttpError(404, "Case not found");
  return ws;
}

async function patchCase(ctx: Ctx, id: string) {
  const { session } = await requirePerm("mutateCases");
  const row = await scopedCase(session.firmId, id);
  if (ctx.body.status && ctx.body.status !== row.status) {
    assertCaseTransition(row.status, ctx.body.status);
    await audit({
      firmId: session.firmId,
      actorId: session.userId,
      action: "case_status_changed",
      targetType: "case",
      targetId: id,
      metadata: { from: row.status, to: ctx.body.status },
    });
  }
  return prisma.case.update({
    where: { id },
    data: {
      status: ctx.body.status,
      title: ctx.body.title,
      notesInternal: ctx.body.notesInternal,
      version: { increment: 1 },
    },
  });
}

async function inviteClient(ctx: Ctx, id: string) {
  const { session } = await requirePerm("mutateCases");
  const row = await scopedCase(session.firmId, id);
  const client = await prisma.client.findUnique({ where: { id: row.clientId } });
  const token = randomToken();
  const otp = randomOtp();
  await prisma.clientInvite.create({
    data: {
      caseId: id,
      email: client!.email,
      tokenHash: hashToken(token),
      otpCode: otp,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });
  await sendEmail({
    firmId: session.firmId,
    caseId: id,
    recipientEmail: client!.email,
    type: "client_invite",
    subject: `Secure document request: ${row.title}`,
    body: `Use this link to open your portal. OTP: ${otp}`,
    idempotencyKey: `invite:${id}:${token}`,
  });
  if (row.status === "Draft") {
    await prisma.case.update({ where: { id }, data: { status: "Intake" } });
  }
  await audit({
    firmId: session.firmId,
    actorId: session.userId,
    action: "client_invited",
    targetType: "case",
    targetId: id,
  });
  await track("client_invited", session.firmId, { caseId: id });
  return { token, otp, portalPath: `/portal/${token}` };
}

async function getChecklist(id: string) {
  const { session } = await requireStaff();
  await scopedCase(session.firmId, id);
  return prisma.checklistItem.findMany({ where: { caseId: id }, orderBy: { sortOrder: "asc" } });
}

async function requestItem(id: string) {
  const { session } = await requirePerm("mutateCases");
  const item = await prisma.checklistItem.findUnique({ include: { case: true }, where: { id } });
  if (!item || item.case.firmId !== session.firmId) throw new HttpError(404, "Item not found");
  if (!canTransitionItem(item.status, "Requested") && item.status !== "Requested") {
    throw new HttpError(400, `Cannot request item from status ${item.status}`);
  }
  const firm = await prisma.firm.findUnique({ where: { id: session.firmId } });
  const updated = await prisma.checklistItem.update({
    where: { id },
    data: {
      status: "Requested",
      nextReminderAt: new Date(Date.now() + (firm?.reminderCadenceDays ?? 3) * 86400000),
    },
  });
  if (item.case.status === "Intake" || item.case.status === "Draft") {
    await prisma.case.update({ where: { id: item.caseId }, data: { status: "Collecting" } });
  }
  await refreshCaseProgress(item.caseId);
  return updated;
}

async function patchItem(ctx: Ctx, id: string) {
  const { session } = await requirePerm("reviewDocuments");
  const item = await prisma.checklistItem.findUnique({ include: { case: true }, where: { id } });
  if (!item || item.case.firmId !== session.firmId) throw new HttpError(404, "Item not found");
  if (ctx.body.status && ctx.body.status !== item.status) {
    if (!canTransitionItem(item.status, ctx.body.status)) {
      throw new HttpError(400, `Invalid checklist transition: ${item.status} → ${ctx.body.status}`);
    }
    if (ctx.body.status === "Waived" && item.required && !ctx.body.waiveReason) {
      throw new HttpError(400, "A reason is required to waive a required item");
    }
    await audit({
      firmId: session.firmId,
      actorId: session.userId,
      action: "checklist_status_changed",
      targetType: "checklist_item",
      targetId: id,
      metadata: { from: item.status, to: ctx.body.status, reason: ctx.body.waiveReason },
    });
  }
  const updated = await prisma.checklistItem.update({
    where: { id },
    data: {
      status: ctx.body.status,
      instructions: ctx.body.instructions,
      dueAt: ctx.body.dueAt ? new Date(ctx.body.dueAt) : undefined,
      waiveReason: ctx.body.waiveReason,
      remindersPaused: ctx.body.remindersPaused,
    },
  });
  if (ctx.body.status === "Accepted") await track("document_accepted", session.firmId);
  await refreshCaseProgress(item.caseId);
  return updated;
}

async function presign(ctx: Ctx) {
  const { session } = await requirePerm("mutateCases");
  const mime = assertAllowedFile(ctx.body.filename, ctx.body.size || 0, ctx.body.mimeType);
  const id = newDocumentId();
  return {
    documentId: id,
    uploadUrl: `/api/v1/documents/upload`,
    method: "POST",
    headers: { "x-document-id": id },
    mime,
    expiresIn: 300,
    firmId: session.firmId,
  };
}

async function uploadDocument(ctx: Ctx) {
  // JSON upload used by demo UI: { caseId, checklistItemId, filename, contentBase64, visibility }
  const staff = await getStaffSession();
  const client = await getClientSession();
  if (!staff && !client) throw new HttpError(401, "Authentication required");
  const filename = ctx.body.filename as string;
  const buf = Buffer.from(ctx.body.contentBase64 || "", "base64");
  const mime = assertAllowedFile(filename, buf.length, ctx.body.mimeType);
  const caseId = ctx.body.caseId as string;
  const checklistItemId = ctx.body.checklistItemId as string | undefined;
  let firmId: string;
  if (staff) {
    const c = await scopedCase(staff.firmId, caseId);
    firmId = c.firmId;
  } else {
    if (client!.caseId !== caseId) throw new HttpError(403, "Client token is scoped to a single case");
    firmId = client!.firmId;
  }
  const existingCount = checklistItemId
    ? await prisma.document.count({ where: { checklistItemId } })
    : 0;
  const version = existingCount + 1;
  const id = ctx.body.documentId || newDocumentId();
  const storageKey = await storeOriginal(buf, filename, id, version);
  const doc = await prisma.document.create({
    data: {
      id,
      caseId,
      checklistItemId,
      firmId,
      originalName: filename,
      storageKey,
      mimeType: mime,
      sizeBytes: buf.length,
      status: "Uploading",
      version,
      visibility: staff && ctx.body.visibility === "staff" ? "staff" : "client",
    },
  });
  if (checklistItemId) {
    const item = await prisma.checklistItem.findUnique({ where: { id: checklistItemId } });
    if (item && ["Not Started", "Requested", "Needs Replacement"].includes(item.status)) {
      await prisma.checklistItem.update({
        where: { id: checklistItemId },
        data: { status: "Submitted" },
      });
    }
  }
  await enqueueJob("document.scan", { documentId: doc.id });
  await audit({
    firmId,
    actorId: staff?.userId,
    actorType: staff ? "user" : "client",
    action: "document_uploaded",
    targetType: "document",
    targetId: doc.id,
  });
  await track("document_uploaded", firmId, { documentId: doc.id, version });
  await refreshCaseProgress(caseId);
  return doc;
}

async function completeUpload(id: string) {
  const { session } = await requireStaff();
  const doc = await prisma.document.findFirst({ where: { id, firmId: session.firmId } });
  if (!doc) throw new HttpError(404, "Document not found");
  await enqueueJob("document.scan", { documentId: id });
  return prisma.document.update({ where: { id }, data: { status: "Processing" } });
}

async function getDocument(id: string) {
  const staff = await getStaffSession();
  const client = await getClientSession();
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { extractions: { orderBy: { createdAt: "desc" } } },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  if (staff && doc.firmId !== staff.firmId) throw new HttpError(404, "Document not found");
  if (client) {
    if (client.caseId !== doc.caseId) throw new HttpError(404, "Document not found");
    if (doc.visibility === "staff") throw new HttpError(403, "This document is staff-only");
  }
  if (!staff && !client) throw new HttpError(401, "Authentication required");
  await audit({
    firmId: doc.firmId,
    actorId: staff?.userId,
    actorType: staff ? "user" : "client",
    action: "document_viewed",
    targetType: "document",
    targetId: doc.id,
  });
  return doc;
}

async function retryProcess(id: string) {
  const { session } = await requirePerm("mutateCases");
  const doc = await prisma.document.findFirst({ where: { id, firmId: session.firmId } });
  if (!doc) throw new HttpError(404, "Document not found");
  await enqueueJob("document.scan", { documentId: id });
  return { ok: true };
}

async function generateSummary(ctx: Ctx, id: string) {
  const { session } = await requirePerm("generateAi");
  const firm = await prisma.firm.findUnique({ where: { id: session.firmId } });
  if (!firm?.aiEnabled) throw new HttpError(400, "AI processing is disabled for this firm");
  const ws = await getCaseWorkspace(session.firmId, id);
  if (!ws) throw new HttpError(404, "Case not found");
  const docs = await prisma.document.findMany({
    where: { caseId: id, status: { in: ["Ready", "Needs Review"] } },
    include: { extractions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const selected = (ctx.body.documentIds as string[] | undefined)
    ? docs.filter((d) => ctx.body.documentIds.includes(d.id))
    : docs;
  const facts: { key: string; value: string; source: string }[] = [];
  const sources = selected.flatMap((d) => {
    const ex = d.extractions[0];
    if (!ex) return [];
    const payload = JSON.parse(ex.payload);
    for (const f of payload.fields ?? []) {
      if (f.value) facts.push({ key: f.key, value: f.value, source: `${d.originalName}` });
    }
    return [
      {
        documentId: d.id,
        documentName: d.originalName,
        page: 1,
        excerpt: (ex.ocrText || "").slice(0, 400),
      },
    ];
  });
  const draft = generateGroundedSummary({
    caseTitle: ws.title,
    caseType: ws.caseType,
    clientName: ws.client.name,
    status: ws.status,
    readiness: ws.readiness,
    checklist: ws.checklistItems.map((i) => ({ title: i.title, status: i.status })),
    facts,
    sources,
    documentTexts: selected.map((d) => ({
      name: d.originalName,
      text: d.extractions[0]?.ocrText || "",
    })),
  });
  const last = await prisma.aISummary.findFirst({ where: { caseId: id }, orderBy: { version: "desc" } });
  const summary = await prisma.aISummary.create({
    data: {
      caseId: id,
      version: (last?.version ?? 0) + 1,
      content: draft.content,
      citations: JSON.stringify(draft.citations),
      status: "draft",
      createdById: session.userId,
    },
  });
  await audit({
    firmId: session.firmId,
    actorId: session.userId,
    action: "ai_summary_generated",
    targetType: "ai_summary",
    targetId: summary.id,
  });
  await track("ai_summary_generated", session.firmId);
  return summary;
}

async function approveSummary(id: string) {
  const { session } = await requirePerm("approveAi");
  const summary = await prisma.aISummary.findUnique({ include: { case: true }, where: { id } });
  if (!summary || summary.case.firmId !== session.firmId) throw new HttpError(404, "Summary not found");
  const updated = await prisma.aISummary.update({
    where: { id },
    data: { status: "approved", reviewedById: session.userId },
  });
  await audit({
    firmId: session.firmId,
    actorId: session.userId,
    action: "ai_summary_approved",
    targetType: "ai_summary",
    targetId: id,
  });
  await track("ai_summary_approved", session.firmId);
  return updated;
}

async function listDeadlines(id: string) {
  const { session } = await requireStaff();
  await scopedCase(session.firmId, id);
  return prisma.deadline.findMany({ where: { caseId: id }, orderBy: { dueAt: "asc" } });
}

async function createDeadline(ctx: Ctx) {
  const { session } = await requirePerm("mutateCases");
  const c = await scopedCase(session.firmId, ctx.body.caseId);
  const firm = await prisma.firm.findUnique({ where: { id: session.firmId } });
  if (ctx.body.critical && !ctx.body.confirmed) {
    throw new HttpError(400, "Critical deadlines require explicit confirmation");
  }
  const row = await prisma.deadline.create({
    data: {
      caseId: c.id,
      title: ctx.body.title,
      type: ctx.body.type || "operational",
      dueAt: new Date(ctx.body.dueAt),
      source: ctx.body.source || "manual",
      critical: !!ctx.body.critical,
      confirmedAt: ctx.body.critical ? new Date() : null,
      timezone: ctx.body.timezone || firm?.timezone || "UTC",
    },
  });
  await track("deadline_created", session.firmId);
  await audit({
    firmId: session.firmId,
    actorId: session.userId,
    action: "deadline_created",
    targetType: "deadline",
    targetId: row.id,
  });
  return row;
}

async function patchDeadline(ctx: Ctx, id: string) {
  const { session } = await requirePerm("mutateCases");
  const d = await prisma.deadline.findUnique({ include: { case: true }, where: { id } });
  if (!d || d.case.firmId !== session.firmId) throw new HttpError(404, "Deadline not found");
  return prisma.deadline.update({
    where: { id },
    data: { status: ctx.body.status, title: ctx.body.title },
  });
}

async function listTemplates() {
  const { session } = await requireStaff();
  return prisma.caseTemplate.findMany({
    where: { firmId: session.firmId },
    include: { items: true, questions: true },
    orderBy: [{ caseType: "asc" }, { version: "desc" }],
  });
}

async function getTemplate(id: string) {
  const { session } = await requireStaff();
  const t = await prisma.caseTemplate.findFirst({
    where: { id, firmId: session.firmId },
    include: { items: true, questions: true },
  });
  if (!t) throw new HttpError(404, "Template not found");
  return t;
}

async function createTemplate(ctx: Ctx) {
  const { session } = await requirePerm("manageTemplates");
  const familyId = crypto.randomUUID();
  return prisma.caseTemplate.create({
    data: {
      firmId: session.firmId,
      name: ctx.body.name,
      caseType: ctx.body.caseType,
      status: "draft",
      familyId,
      reminderDefaults: JSON.stringify(ctx.body.reminderDefaults ?? { cadenceDays: 3 }),
      items: {
        create: ((ctx.body.items as { title: string; required?: boolean; instructions?: string; allowedTypes?: string; dueOffsetDays?: number; expectedSchema?: string[] }[] | undefined) ?? []).map((item, idx) => ({
          title: item.title,
          required: !!item.required,
          instructions: item.instructions || "",
          allowedTypes: item.allowedTypes || "pdf,jpg,png",
          dueOffsetDays: item.dueOffsetDays ?? 14,
          expectedSchema: JSON.stringify(item.expectedSchema ?? []),
          sortOrder: idx,
        })),
      },
      questions: {
        create: ((ctx.body.questions as { prompt: string; fieldKey: string; required?: boolean; inputType?: string }[] | undefined) ?? []).map((q, idx) => ({
          prompt: q.prompt,
          fieldKey: q.fieldKey,
          required: !!q.required,
          inputType: q.inputType || "text",
          sortOrder: idx,
        })),
      },
    },
  });
}

async function patchTemplate(ctx: Ctx, id: string) {
  const { session } = await requirePerm("manageTemplates");
  const t = await prisma.caseTemplate.findFirst({ where: { id, firmId: session.firmId } });
  if (!t) throw new HttpError(404, "Template not found");
  if (t.status === "published") {
    throw new HttpError(400, "Published templates are immutable. Create a new version instead.");
  }
  return prisma.caseTemplate.update({
    where: { id },
    data: { name: ctx.body.name, caseType: ctx.body.caseType },
  });
}

async function publishTemplate(id: string) {
  const { session } = await requirePerm("manageTemplates");
  const next = await publishTemplateVersion(id, session.firmId);
  await track("template_published", session.firmId);
  await audit({
    firmId: session.firmId,
    actorId: session.userId,
    action: "template_published",
    targetType: "template",
    targetId: next.id,
    metadata: { version: next.version },
  });
  return next;
}

async function auditEvents(ctx: Ctx) {
  const { session } = await requirePerm("viewAudit");
  return prisma.auditEvent.findMany({
    where: { firmId: session.firmId },
    orderBy: { createdAt: "desc" },
    take: Number(ctx.url.searchParams.get("limit") || 100),
  });
}

async function listTasks() {
  const { session } = await requireStaff();
  return prisma.task.findMany({
    where: { case: { firmId: session.firmId } },
    include: { case: { include: { client: true } }, assignee: true },
    orderBy: { createdAt: "desc" },
  });
}

async function createTask(ctx: Ctx) {
  const { session } = await requirePerm("mutateCases");
  await scopedCase(session.firmId, ctx.body.caseId);
  return prisma.task.create({
    data: {
      caseId: ctx.body.caseId,
      assigneeId: ctx.body.assigneeId,
      title: ctx.body.title,
      dueAt: ctx.body.dueAt ? new Date(ctx.body.dueAt) : null,
      visibility: "staff",
    },
  });
}

async function patchTask(ctx: Ctx, id: string) {
  const { session } = await requirePerm("mutateCases");
  const t = await prisma.task.findUnique({ include: { case: true }, where: { id } });
  if (!t || t.case.firmId !== session.firmId) throw new HttpError(404, "Task not found");
  return prisma.task.update({ where: { id }, data: { status: ctx.body.status, title: ctx.body.title } });
}

async function listUsers() {
  const { session } = await requirePerm("manageUsers");
  return prisma.user.findMany({
    where: { firmId: session.firmId, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, status: true, mfaEnabled: true },
  });
}

async function inviteUser(ctx: Ctx) {
  const { session } = await requirePerm("manageUsers");
  const passwordHash = await hashPassword(ctx.body.temporaryPassword || "ChangeMe123!");
  const user = await prisma.user.create({
    data: {
      firmId: session.firmId,
      email: ctx.body.email.toLowerCase(),
      name: ctx.body.name,
      role: ctx.body.role,
      status: "active",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  await audit({
    firmId: session.firmId,
    actorId: session.userId,
    action: "user_invited",
    targetType: "user",
    targetId: user.id,
    metadata: { role: user.role },
  });
  return user;
}

async function patchUser(ctx: Ctx, id: string) {
  const { session } = await requirePerm("manageUsers");
  const user = await prisma.user.findFirst({ where: { id, firmId: session.firmId } });
  if (!user) throw new HttpError(404, "User not found");
  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: ctx.body.role,
      status: ctx.body.status,
      mfaEnabled: ctx.body.mfaEnabled,
    },
  });
  if (ctx.body.role && ctx.body.role !== user.role) {
    await audit({
      firmId: session.firmId,
      actorId: session.userId,
      action: "role_changed",
      targetType: "user",
      targetId: id,
      metadata: { from: user.role, to: ctx.body.role },
    });
  }
  return { id: updated.id, role: updated.role, status: updated.status };
}

async function getSettings() {
  const { session } = await requireStaff();
  return prisma.firm.findUnique({ where: { id: session.firmId } });
}

async function patchSettings(ctx: Ctx) {
  const { session } = await requirePerm("manageSettings");
  return prisma.firm.update({
    where: { id: session.firmId },
    data: {
      timezone: ctx.body.timezone,
      reminderCadenceDays: ctx.body.reminderCadenceDays,
      aiEnabled: ctx.body.aiEnabled,
      dataRetentionDays: ctx.body.dataRetentionDays,
    },
  });
}

async function getBilling() {
  const { session } = await requirePerm("manageBilling");
  return prisma.subscription.findUnique({ where: { firmId: session.firmId } });
}

async function checkout(ctx: Ctx) {
  const { session } = await requirePerm("manageBilling");
  const sub = await prisma.subscription.update({
    where: { firmId: session.firmId },
    data: {
      plan: ctx.body.plan || "practice",
      status: "active",
      providerCustomerId: `cus_demo_${session.firmId.slice(0, 8)}`,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    },
  });
  await prisma.firm.update({ where: { id: session.firmId }, data: { planId: sub.plan } });
  await track("subscription_started", session.firmId, { plan: sub.plan });
  return sub;
}

async function billingWebhook(ctx: Ctx) {
  const sig = ctx.req.headers.get("x-billing-signature");
  const expected = process.env.SESSION_SECRET || "dev-session-secret-change-in-production-please-32b";
  if (sig !== expected) throw new HttpError(401, "Invalid webhook signature");
  const firmId = ctx.body.firmId;
  if (!firmId) throw new HttpError(400, "Missing firmId");
  if (ctx.idempotency) {
    const hit = await prisma.idempotencyKey.findUnique({ where: { id: `billing:${ctx.idempotency}` } });
    if (hit) return JSON.parse(hit.response);
  }
  const status = ctx.body.status || "past_due";
  const sub = await prisma.subscription.update({
    where: { firmId },
    data: { status, plan: ctx.body.plan ?? undefined },
  });
  if (status === "canceled") await track("subscription_cancelled", firmId);
  const response = { ok: true, sub };
  if (ctx.idempotency) {
    await prisma.idempotencyKey.create({
      data: { id: `billing:${ctx.idempotency}`, response: JSON.stringify(response) },
    });
  }
  return response;
}

async function listNotifications() {
  const { session } = await requireStaff();
  return prisma.notification.findMany({
    where: { firmId: session.firmId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

async function notifPrefs(ctx: Ctx) {
  const { session } = await requirePerm("manageSettings");
  return prisma.firm.update({
    where: { id: session.firmId },
    data: { reminderCadenceDays: ctx.body.reminderCadenceDays },
  });
}

async function portalMagic(ctx: Ctx) {
  const invite = await prisma.clientInvite.findFirst({
    where: { tokenHash: hashToken(ctx.body.token || ""), usedAt: null },
    include: { case: { include: { client: true } } },
  });
  if (!invite || invite.expiresAt < new Date()) throw new HttpError(401, "Invitation expired");
  return { email: invite.email, otpRequired: true, caseTitle: invite.case.title };
}

async function portalOtp(ctx: Ctx) {
  const invite = await prisma.clientInvite.findFirst({
    where: { tokenHash: hashToken(ctx.body.token || ""), usedAt: null },
    include: { case: { include: { client: true } } },
  });
  if (!invite || invite.expiresAt < new Date()) throw new HttpError(401, "Invitation expired");
  if (invite.otpCode !== ctx.body.otp) throw new HttpError(401, "Invalid code");
  await setClientSession({
    clientId: invite.case.clientId,
    caseId: invite.caseId,
    firmId: invite.case.firmId,
    email: invite.email,
  });
  await prisma.clientInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
  await track("client_portal_opened", invite.case.firmId, { caseId: invite.caseId });
  return { ok: true };
}

async function portalCase() {
  const session = await requireClient();
  const ws = await getCaseWorkspace(session.firmId, session.caseId);
  if (!ws) throw new HttpError(404, "Case not found");
  const items = ws.checklistItems.map((i) => ({
    id: i.id,
    title: i.title,
    required: i.required,
    instructions: i.instructions,
    allowedTypes: i.allowedTypes,
    status: i.status,
    dueAt: i.dueAt,
    documents: i.documents
      .filter((d) => d.visibility !== "staff")
      .map((d) => ({ id: d.id, originalName: d.originalName, status: d.status, version: d.version })),
  }));
  return {
    title: ws.title,
    caseType: ws.caseType,
    status: ws.status,
    clientName: ws.client.name,
    readiness: ws.readiness,
    nextAction: ws.nextAction,
    checklist: items,
    intake: ws.intakeResponses,
  };
}

async function portalIntake(ctx: Ctx) {
  const session = await requireClient();
  const answers = ctx.body.answers as Record<string, string>;
  for (const [fieldKey, answer] of Object.entries(answers || {})) {
    await prisma.intakeResponse.updateMany({
      where: { caseId: session.caseId, fieldKey },
      data: { answer: String(answer) },
    });
  }
  const c = await prisma.case.findUnique({ where: { id: session.caseId } });
  if (c?.status === "Intake" || c?.status === "Draft") {
    await prisma.case.update({ where: { id: session.caseId }, data: { status: "Collecting" } });
  }
  return { ok: true };
}

async function portalUpload(ctx: Ctx) {
  const session = await requireClient();
  ctx.body.caseId = session.caseId;
  ctx.body.visibility = "client";
  return uploadDocument(ctx);
}

export async function downloadDocumentBuffer(id: string) {
  const staff = await getStaffSession();
  const client = await getClientSession();
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new HttpError(404, "Document not found");
  if (staff && doc.firmId !== staff.firmId) throw new HttpError(404, "Document not found");
  if (client) {
    if (client.caseId !== doc.caseId || doc.visibility === "staff") throw new HttpError(403, "Denied");
  }
  if (!staff && !client) throw new HttpError(401, "Authentication required");
  const buf = await readStored(doc.storageKey);
  await audit({
    firmId: doc.firmId,
    actorId: staff?.userId,
    actorType: staff ? "user" : "client",
    action: "document_downloaded",
    targetType: "document",
    targetId: doc.id,
  });
  return { buf, doc };
}
