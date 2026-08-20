import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { HttpError } from "./http";
import type { StaffRole } from "./domain/roles";

const SESSION_COOKIE = "dashlaw_session";
const CLIENT_COOKIE = "dashlaw_client";

function secret() {
  return process.env.SESSION_SECRET || "dev-session-secret-change-in-production-please-32b";
}

function sign(payload: string) {
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string) {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export function randomToken() {
  return randomBytes(32).toString("hex");
}

export function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type StaffSession = {
  userId: string;
  firmId: string;
  role: StaffRole;
  email: string;
  name: string;
  exp: number;
};

export type ClientSession = {
  clientId: string;
  caseId: string;
  firmId: string;
  email: string;
  exp: number;
};

export async function setStaffSession(session: Omit<StaffSession, "exp">, days = 7) {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + days * 86400000 }),
  ).toString("base64url");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: days * 86400,
  });
}

export async function setClientSession(session: Omit<ClientSession, "exp">, hours = 12) {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + hours * 3600000 }),
  ).toString("base64url");
  const jar = await cookies();
  jar.set(CLIENT_COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: hours * 3600,
  });
}

export async function clearSessions() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CLIENT_COOKIE);
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const data = verify(raw);
  if (!data?.userId) return null;
  return data as StaffSession;
}

export async function getClientSession(): Promise<ClientSession | null> {
  const jar = await cookies();
  const raw = jar.get(CLIENT_COOKIE)?.value;
  if (!raw) return null;
  const data = verify(raw);
  if (!data?.clientId || !data?.caseId) return null;
  return data as ClientSession;
}

export async function requireStaff() {
  const session = await getStaffSession();
  if (!session) throw new HttpError(401, "Authentication required");
  const user = await prisma.user.findFirst({
    where: { id: session.userId, deletedAt: null, status: { not: "deactivated" } },
  });
  if (!user || user.firmId !== session.firmId) throw new HttpError(401, "Authentication required");
  return { session, user };
}

export async function requireClient() {
  const session = await getClientSession();
  if (!session) throw new HttpError(401, "Client authentication required");
  return session;
}

export function hashOtp(otp: string) {
  return scryptSync(otp, secret(), 32).toString("hex");
}
