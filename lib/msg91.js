const AUTH_KEY = process.env.MSG91_API_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const OTP_LENGTH = Number(process.env.OTP_LENGTH || 4);
const BASE = "https://api.msg91.com/api/v5";

export function generateOtp() {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  const range = max - min + 1;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(min + (buf[0] % range));
}

// MSG91 wants the number with the country code and no plus: 919876543210
function e164(phone) {
  return `91${String(phone).replace(/\D/g, "").slice(-10)}`;
}

export async function sendOtp(phone, code) {
  // No key configured -> print the code to the server log so the whole flow
  // can be tested without spending SMS credits.
  if (!AUTH_KEY || !TEMPLATE_ID || AUTH_KEY.length < 20) {
    console.log(`\n[DEV MODE] OTP for ${phone} is ${code}\n`);
    return { ok: true, dev: true };
  }

  const url =
    `${BASE}/otp?template_id=${TEMPLATE_ID}` +
    `&mobile=${e164(phone)}&authkey=${AUTH_KEY}&otp=${code}`;

  try {
    const res = await fetch(url, { method: "POST", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (data?.type === "success") return { ok: true };
    console.error("MSG91 send failed:", data);
    return { ok: false, error: data?.message || "Could not send the code" };
  } catch (err) {
    console.error("MSG91 send error:", err);
    return { ok: false, error: "SMS service is not responding" };
  }
}

// Only used when VERIFY_MODE=msg91.
export async function verifyOtpRemote(phone, code) {
  if (!AUTH_KEY) return { ok: true, dev: true };
  const url = `${BASE}/otp/verify?authkey=${AUTH_KEY}&mobile=${e164(
    phone
  )}&otp=${code}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return data?.type === "success"
      ? { ok: true }
      : { ok: false, error: data?.message || "That code is not correct" };
  } catch {
    return { ok: false, error: "Could not reach the SMS service" };
  }
}