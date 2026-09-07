import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  readPending,
  createPending,
  pendingCookieOptions,
  createSession,
  sessionCookieOptions,
  hashCode,
  PENDING_COOKIE,
  SESSION_COOKIE,
} from "@/lib/session";
import { verifyOtpRemote } from "@/lib/msg91";
import { saveLead } from "@/lib/db";
import { findClass } from "@/lib/config";

const MAX_TRIES = 5;

export async function POST(req) {
  const { code = "" } = await req.json().catch(() => ({}));
  const entered = String(code).replace(/\D/g, "");

  const pending = await readPending(cookies().get(PENDING_COOKIE)?.value);
  if (!pending) {
    return NextResponse.json(
      { error: "That code expired. Ask for a new one." },
      { status: 400 }
    );
  }

  if (Number(pending.tries || 0) >= MAX_TRIES) {
    return NextResponse.json(
      { error: "Too many wrong codes. Ask for a new one." },
      { status: 429 }
    );
  }

  const ok =
    process.env.VERIFY_MODE === "msg91"
      ? (await verifyOtpRemote(pending.phone, entered)).ok
      : (await hashCode(entered, pending.phone)) === pending.codeHash;

  if (!ok) {
    const next = await createPending({
      ...pending,
      tries: Number(pending.tries || 0) + 1,
    });
    const res = NextResponse.json(
      { error: "That code is not correct" },
      { status: 401 }
    );
    res.cookies.set(PENDING_COOKIE, next, pendingCookieOptions());
    return res;
  }

  const session = await createSession({
    name: pending.name,
    cls: pending.cls,
    phone: pending.phone,
  });

  // The one and only write per student. Duplicates are dropped by the
  // unique phone constraint, so re-verifying never adds a second row.
  await saveLead({
    name: pending.name,
    phone: pending.phone,
    cls: findClass(pending.cls)?.label || pending.cls,
  });

  const res = NextResponse.json({ ok: true, name: pending.name });
  res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
  res.cookies.set(PENDING_COOKIE, "", { ...pendingCookieOptions(), maxAge: 0 });
  return res;
}