import { redirect } from "next/navigation";
import { getStaffSession, getClientSession } from "./auth";
import { prisma } from "./db";

export async function requireStaffPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findFirst({
    where: { id: session.userId, deletedAt: null, status: { not: "deactivated" } },
  });
  if (!user) redirect("/login");
  const firm = await prisma.firm.findUnique({ where: { id: session.firmId } });
  if (!firm) redirect("/login");
  return { session, user, firm };
}

export async function requireClientPage() {
  const session = await getClientSession();
  if (!session) redirect("/portal");
  return session;
}
