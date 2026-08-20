import { prisma } from "./db";

export async function audit(input: {
  firmId: string;
  actorId?: string | null;
  actorType?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}) {
  await prisma.auditEvent.create({
    data: {
      firmId: input.firmId,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? "user",
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: JSON.stringify(input.metadata ?? {}),
      requestId: input.requestId,
    },
  });
}

export async function track(name: string, firmId?: string | null, properties?: Record<string, unknown>) {
  await prisma.analyticsEvent.create({
    data: {
      name,
      firmId: firmId ?? null,
      properties: JSON.stringify(properties ?? {}),
    },
  });
}
