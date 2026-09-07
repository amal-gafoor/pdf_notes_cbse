import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateOtp, sendOtp } from "@/lib/msg91";
import {
  createPending,
  pendingCookieOptions,
  readPending,
  PENDING_COOKIE,
  hashCode,
} from "@/lib/session";
import { tooManySends } from "@/lib/ratelimit";
import { findClass } from "@/lib/config";

const COOLDOWN_MS = 30 * 1000;
const MAX_SENDS = Number(process.env.MAX_SENDS_PER_HOUR || 5);

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 60);
  const cls = String(body.cls || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  const resource = String(body.resource || "").slice(0, 60);

  if (name.length < 2)
    return NextResponse.json({ error: "Enter your full name" }, { status: 400 });
  if (!findClass(cls))
    return NextResponse.json({ error: "Choose your class" }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(phone))
    return NextResponse.json(
      { error: "Enter a valid 10-digit mobile number" },
      { status: 400 }
    );

  const prev = await readPending(cookies().get(PENDING_COOKIE)?.value);
  const sameNumber = prev?.phone === phone;
  const sends = sameNumber ? Number(prev.sends || 0) : 0;

  if (sameNumber && prev.sentAt && Date.now() - prev.sentAt < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (Date.now() - prev.sentAt)) / 1000);
    return NextResponse.json(
      { error: `Wait ${wait}s before asking for a new code` },
      { status: 429 }
    );
  }

  if (sends >= MAX_SENDS || tooManySends(phone)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  const code = generateOtp();
  const sent = await sendOtp(phone, code);
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 502 });
  }

  const pending = await createPending({
    name,
    cls,
    phone,
    resource,
    codeHash: await hashCode(code, phone),
    sentAt: Date.now(),
    sends: sends + 1,
    tries: 0,
  });

  const res = NextResponse.json({
    ok: true,
    masked: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
    dev: !!sent.dev,
  });
  res.cookies.set(PENDING_COOKIE, pending, pendingCookieOptions());
  return res;
}