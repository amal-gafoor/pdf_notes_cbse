"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CLASSES } from "@/lib/config";

const COOLDOWN = 30;

export default function Gate({ classSlug, className, resource, otpLength = 4 }) {
  const router = useRouter();
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({ name: "", cls: classSlug, phone: "" });
  const [digits, setDigits] = useState(Array(otpLength).fill(""));
  const [masked, setMasked] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const boxes = useRef([]);

  useEffect(() => {
    if (!left) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // Android Chrome can read the code straight out of the SMS.
  useEffect(() => {
    if (step !== "otp" || !("OTPCredential" in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((c) => c?.code && fill(c.code))
      .catch(() => {});
    return () => ac.abort();
  }, [step]);

  function fill(value) {
    const next = String(value).replace(/\D/g, "").slice(0, otpLength).split("");
    const padded = Array(otpLength)
      .fill("")
      .map((_, i) => next[i] || "");
    setDigits(padded);
    if (next.length === otpLength) submitOtp(next.join(""));
    else boxes.current[next.length]?.focus();
  }

  async function sendOtp(e) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, resource }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong");
    setMasked(data.masked);
    setDigits(Array(otpLength).fill(""));
    setStep("otp");
    setLeft(COOLDOWN);
    setTimeout(() => boxes.current[0]?.focus(), 60);
  }

  async function submitOtp(code) {
    const value = code || digits.join("");
    if (value.length < otpLength) return setError("Enter the full code");
    setError("");
    setBusy(true);
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      setDigits(Array(otpLength).fill(""));
      boxes.current[0]?.focus();
      return setError(data.error || "That code is not correct");
    }
    router.replace(resource ? `/api/open/${resource}` : "/library");
    router.refresh();
  }

  function onDigit(i, value) {
    const v = value.replace(/\D/g, "");
    if (v.length > 1) return fill(v);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < otpLength - 1) boxes.current[i + 1]?.focus();
    if (v && i === otpLength - 1) submitOtp(next.join(""));
  }

  function onKey(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      boxes.current[i - 1]?.focus();
    }
  }

  if (step === "details") {
    return (
      <form onSubmit={sendOtp} noValidate>
        <div className="relative bg-white rounded-2xl shadow-card p-6 overflow-hidden">
          <span className="cap-corner" aria-hidden="true" />

          <h1 className="font-display text-[22px] font-semibold leading-snug">
            {className} free model question papers
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-70">
            Free chapter notes and question papers. Tell us where to send them.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium mb-1.5">
                Full name
              </label>
              <input
                id="name"
                className="field"
                autoComplete="name"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="cls" className="block text-[13px] font-medium mb-1.5">
                Class
              </label>
              <select
                id="cls"
                className="field appearance-none"
                value={form.cls}
                onChange={(e) => setForm({ ...form, cls: e.target.value })}
              >
                {CLASSES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="block text-[13px] font-medium mb-1.5">
                Mobile number
              </label>
              <div className="flex gap-2">
                <span className="h-12 px-3.5 grid place-items-center rounded-xl border border-ink-10 bg-white text-ink-70 text-[15px] shrink-0">
                  +91
                </span>
                <input
                  id="phone"
                  className="field"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {error && <Alert>{error}</Alert>}

          <button className="btn-primary mt-6" disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>

          <p className="mt-3 text-center text-[12px] text-ink-50">
            One SMS confirms it is you. No spam.
          </p>
        </div>
      </form>
    );
  }

  return (
    <div className="relative bg-white rounded-2xl shadow-card p-6 overflow-hidden">
      <span className="cap-corner" aria-hidden="true" />

      <button
        type="button"
        onClick={() => {
          setStep("details");
          setError("");
        }}
        className="text-[13px] text-ink-70 hover:text-brand transition-colors"
      >
        ← Change number
      </button>

      <h1 className="mt-4 font-display text-[22px] font-semibold">
        Enter the code
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-70">Sent to {masked}</p>

      <div
        className="mt-6 grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${otpLength}, minmax(0,1fr))` }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (boxes.current[i] = el)}
            className="otp-box"
            type="tel"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            value={d}
            onChange={(e) => onDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>

      {error && <Alert>{error}</Alert>}

      <button
        className="btn-primary mt-6"
        onClick={() => submitOtp()}
        disabled={busy}
      >
        {busy ? "Checking…" : "Verify"}
      </button>

      <div className="mt-4 text-center text-[13px]">
        {left > 0 ? (
          <span className="text-ink-50">
            Resend in 0:{String(left).padStart(2, "0")}
          </span>
        ) : (
          <button
            type="button"
            onClick={sendOtp}
            className="text-brand font-medium hover:underline"
          >
            Send a new code
          </button>
        )}
      </div>
    </div>
  );
}

function Alert({ children }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-brand-700"
    >
      {children}
    </p>
  );
}