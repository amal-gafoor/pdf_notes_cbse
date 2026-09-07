import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-secret-change-me-in-production-please!!"
);

export const SESSION_COOKIE = "ep_session";
export const PENDING_COOKIE = "ep_pending";

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 180);

async function sign(payload, expiresIn) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

async function read(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// --- long-lived session: "this browser is verified" ------------------------

export async function createSession({ name, cls, phone }) {
  return sign({ name, cls, phone }, `${SESSION_DAYS}d`);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function getSession() {
  return read(cookies().get(SESSION_COOKIE)?.value);
}

// --- short-lived pending state: "an OTP is in flight" ----------------------
// Holds the student's details plus a hash of the code, so /verify-otp cannot
// be called with an arbitrary phone number.

export async function createPending(data) {
  return sign(data, "10m");
}

export function pendingCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  };
}

export async function readPending(token) {
  return read(token);
}

// Hash the OTP rather than storing it in plain text, so a leaked cookie is
// not a usable code.
export async function hashCode(code, phone) {
  const data = new TextEncoder().encode(
    `${code}:${phone}:${process.env.JWT_SECRET || "dev"}`
  );
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}