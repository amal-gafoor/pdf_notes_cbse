// Server-side send cap, keyed by phone number.
//
// /send-otp already counts sends in the pending cookie, but a student who
// clears cookies gets a fresh counter. This is the backstop: it lives in
// server memory, so clearing cookies does not reset it.
//
// In-memory means it is per-instance and resets on redeploy. That is fine for
// a single small box; move to Redis if this ever runs on more than one.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS = Number(process.env.MAX_SENDS_PER_HOUR || 5);

const hits = new Map(); // phone -> number[] (timestamps)

// Drop keys nobody has touched for a full window, so the map cannot grow
// without bound.
function sweep(now) {
  for (const [key, stamps] of hits) {
    const live = stamps.filter((t) => now - t < WINDOW_MS);
    if (live.length) hits.set(key, live);
    else hits.delete(key);
  }
}

// Returns true when this phone has already used up its hourly sends. Counts
// the current send when it is allowed through.
export function tooManySends(phone) {
  const now = Date.now();
  sweep(now);

  const recent = (hits.get(phone) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_SENDS) {
    hits.set(phone, recent);
    return true;
  }

  recent.push(now);
  hits.set(phone, recent);
  return false;
}
