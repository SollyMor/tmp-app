import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "taskflow_session";
const BCRYPT_COST = 10;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  nick: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinSecret(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length],
  ).join("");
}

export function composeJoinCode(workspaceId: string, secret: string) {
  return `${workspaceId}-${secret}`;
}

export function parseJoinCode(code: string) {
  const normalized = code.trim();
  const separator = normalized.lastIndexOf("-");
  if (separator <= 0 || separator === normalized.length - 1) return null;

  return {
    workspaceId: normalized.slice(0, separator),
    secret: normalized.slice(separator + 1).toUpperCase(),
  };
}

export async function hashJoinSecret(secret: string) {
  return bcrypt.hash(secret.toUpperCase(), BCRYPT_COST);
}

export async function verifyJoinSecret(secret: string, hash: string) {
  return bcrypt.compare(secret.toUpperCase(), hash);
}
