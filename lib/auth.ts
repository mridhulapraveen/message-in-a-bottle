import { pbkdf2Sync, scryptSync, timingSafeEqual } from "crypto";

import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";

import { getDb, type User } from "./db";

const COOKIE = "mib_session";

function secretKey() {
  const secret = process.env.SECRET_KEY || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, stored: string) {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);
  }
  if (stored.startsWith("scrypt:")) {
    return verifyScrypt(password, stored);
  }
  if (stored.startsWith("pbkdf2:")) {
    return verifyPbkdf2(password, stored);
  }
  return false;
}

function verifyScrypt(password: string, stored: string) {
  const [method, salt, hash] = stored.split("$");
  if (!method || !salt || !hash) return false;
  const [, n, r, p] = method.split(":");
  const N = Number(n);
  const R = Number(r);
  const P = Number(p);
  if (![N, R, P].every((value) => Number.isFinite(value) && value > 0)) return false;
  const expected = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, expected.length, {
    N,
    r: R,
    p: P,
    maxmem: 128 * 1024 * 1024,
  });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function verifyPbkdf2(password: string, stored: string) {
  const [method, salt, hash] = stored.split("$");
  if (!method || !salt || !hash) return false;
  const [, algo, iterations] = method.split(":");
  const rounds = Number(iterations);
  if (!algo || !Number.isFinite(rounds)) return false;
  const expected = Buffer.from(hash, "hex");
  const derived = pbkdf2Sync(password, salt, rounds, expected.length, algo);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

async function cookieSecure() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  const host = h.get("host") ?? "";
  return !host.startsWith("localhost") && !host.startsWith("127.0.0.1");
}

export async function setSession(userId: number) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const uid = Number(payload.uid);
    if (!Number.isFinite(uid)) return null;
    const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(uid) as User | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export function safeNext(value: FormDataEntryValue | string | null, fallback = "/") {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) {
    return fallback;
  }
  return raw;
}
