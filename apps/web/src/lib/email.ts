import { prisma } from "./db";
import { audit, track } from "./audit";

export async function sendEmail(input: {
  firmId: string;
  caseId?: string | null;
  recipientId?: string | null;
  recipientEmail: string;
  type: string;
  subject: string;
  body: string;
  idempotencyKey: string;
}) {
  const existing = await prisma.notification.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return existing;

  const notification = await prisma.notification.create({
    data: {
      ...input,
      channel: "email",
      status: "sent",
      sentAt: new Date(),
      providerResponse: JSON.stringify({ provider: "console-dev", ok: true }),
    },
  });
  console.info(`[email:${input.type}] to=${input.recipientEmail} subject=${input.subject}`);
  await audit({
    firmId: input.firmId,
    actorType: "system",
    action: "reminder_sent",
    targetType: "notification",
    targetId: notification.id,
    metadata: { type: input.type, recipientEmail: input.recipientEmail },
  });
  if (input.type === "checklist_reminder") await track("reminder_sent", input.firmId);
  return notification;
}
