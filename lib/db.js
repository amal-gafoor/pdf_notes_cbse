// Stores one row per student in Supabase.
//
// Written straight over PostgREST with fetch — the supabase-js client would be
// a dependency for a single INSERT.

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function saveLead({ name, phone, cls }) {
  if (!URL || !KEY) {
    console.log("[lead]", { name, phone, cls });
    return;
  }

  try {
    const res = await fetch(`${URL}/rest/v1/leads?on_conflict=phone`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        // A student verifying again on another browser is the same student,
        // so the duplicate is dropped instead of becoming a second row.
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({ name, phone, class: cls }),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Lead insert failed (${res.status}):`, detail.slice(0, 200));
    }
  } catch (err) {
    // Never block a student on the database being unreachable.
    console.error("Lead insert error:", err);
  }
}
