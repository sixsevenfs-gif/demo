import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CALLING_EXECUTIVE";
  dailyTarget: number;
  avatar?: string | null;
}

export const SESSION_COOKIE_NAME = "dwa_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters");
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string, role: SessionUser["role"]): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${userId}.${role}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function readSessionToken(token: string): { userId: string; role: SessionUser["role"] } | null {
  const [userId, role, expiresAt, signature, ...rest] = token.split(".");
  if (!userId || !role || !expiresAt || !signature || rest.length > 0) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(userId) || !/^\d+$/.test(expiresAt)) return null;
  if (role !== "ADMIN" && role !== "CALLING_EXECUTIVE") return null;
  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) return null;

  const expectedSignature = sign(`${userId}.${role}.${expiresAt}`);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  return { userId, role };
}

export const sessionCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE,
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) return null;

  try {
    const session = readSessionToken(sessionCookie.value);
    if (!session) return null;
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.status === "INACTIVE") return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "CALLING_EXECUTIVE",
      dailyTarget: user.dailyTarget,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN: Admin permissions required");
  }
  return user;
}
