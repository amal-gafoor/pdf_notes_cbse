// Mirrors every lead into a Google Sheet, alongside the Supabase row.
//
// The sheet is for the people who work the leads — Supabase stays the system
// of record. Both writes are best-effort: a student is never blocked because
// a spreadsheet was slow.

const URL = process.env.SHEET_WEBAPP_URL;
const SECRET = process.env.SHEET_SECRET;

export async function appendLeadToSheet({ name, phone, cls }) {
  if (!URL || !SECRET) {
    console.log("[sheet] not configured, skipping:", { name, phone, cls });
    return;
  }

  try {
    // Apps Script answers /exec with a 302 to googleusercontent.com; fetch
    // follows it by default, which is how this endpoint is meant to work.
    // text/plain avoids Apps Script's stricter JSON content-type handling —
    // it reads the raw body either way.
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: SECRET, name, phone, class: cls }),
      cache: "no-store",
      // A hung spreadsheet must not hold up the OTP response.
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      console.error("Sheet append failed:", res.status, data.error || "");
    }
  } catch (err) {
    console.error("Sheet append error:", err);
  }
}
