// Lists private Drive folders with a service account.
//
// The service account reads folder contents that are not otherwise
// browsable, so the app can render a library without a public folder
// link. Files themselves are handed to students as Drive urls by
// /api/open after a session check — the bytes never pass through here.

import { SignJWT, importPKCS8 } from "jose";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const API = "https://www.googleapis.com/drive/v3";

// Folder listings change rarely; a short cache keeps the library page fast and
// stays well clear of Drive's rate limits.
const LIST_TTL_MS = 5 * 60 * 1000;

let credsCache;
let tokenCache = { value: null, expiresAt: 0 };
const listCache = new Map();
const parentCache = new Map();
const metaCache = new Map();

// The whole service-account JSON, base64'd into one env var. Storing it raw
// means the \n inside private_key survives Vercel's env editor untouched.
function credentials() {
  if (credsCache !== undefined) return credsCache;

  const raw = process.env.GOOGLE_CREDENTIALS_B64;
  if (!raw) {
    credsCache = null;
    return null;
  }
  try {
    credsCache = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    console.error("GOOGLE_CREDENTIALS_B64 is not valid base64-encoded JSON");
    credsCache = null;
  }
  return credsCache;
}

export function isConfigured() {
  return !!credentials();
}

async function accessToken() {
  const creds = credentials();
  if (!creds) throw new Error("GOOGLE_CREDENTIALS_B64 is not set");

  if (tokenCache.value && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value;
  }

  const key = await importPKCS8(creds.private_key, "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(creds.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Drive auth failed: ${data.error_description || data.error || res.status}`
    );
  }

  // Expire a minute early so a request in flight never carries a dead token.
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in || 3600) - 60) * 1000,
  };
  return tokenCache.value;
}

async function driveFetch(path, extraHeaders = {}) {
  const token = await accessToken();
  return fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, ...extraHeaders },
    cache: "no-store",
  });
}

// Everything a Google Doc/Sheet/Slides file needs to come out as a PDF.
const GOOGLE_NATIVE = "application/vnd.google-apps";
const FOLDER_MIME = `${GOOGLE_NATIVE}.folder`;
const SHORTCUT_MIME = `${GOOGLE_NATIVE}.shortcut`;

const FILE_FIELDS =
  "id,name,mimeType,size,parents,trashed,webViewLink,shortcutDetails(targetId,targetMimeType)";

// A class folder may hold papers directly (Class 8/9/10) or group them into
// subfolders (Plus Two: LIVE NOTES, MICRO BIT, MODEL QUESTION PAPER), so both
// are returned and the library renders folders first.
export async function listFolder(folderId) {
  const cached = listCache.get(folderId);
  if (cached && Date.now() < cached.expiresAt) return cached.listing;

  const q = `'${folderId}' in parents and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: "files(id,name,mimeType,size,shortcutDetails(targetId,targetMimeType))",
    orderBy: "name_natural",
    pageSize: "200",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const res = await driveFetch(`/files?${params}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Drive list failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const entries = (await res.json()).files || [];
  const listing = {
    folders: entries.filter((f) => f.mimeType === FOLDER_MIME),
    // A shortcut should read as whatever it points at ("PDF", not "Google
    // Doc"). The id stays the shortcut's — /api/open resolves it.
    files: entries
      .filter((f) => f.mimeType !== FOLDER_MIME)
      .map((f) =>
        f.mimeType === SHORTCUT_MIME
          ? { ...f, mimeType: f.shortcutDetails?.targetMimeType || f.mimeType }
          : f
      ),
  };

  listCache.set(folderId, { listing, expiresAt: Date.now() + LIST_TTL_MS });
  return listing;
}

export async function getMeta(id) {
  const cached = metaCache.get(id);
  if (cached && Date.now() < cached.expiresAt) return cached.meta;

  const params = new URLSearchParams({
    fields: FILE_FIELDS,
    supportsAllDrives: "true",
  });

  const res = await driveFetch(`/files/${encodeURIComponent(id)}?${params}`);
  if (!res.ok) return null;

  const meta = await res.json();
  metaCache.set(id, { meta, expiresAt: Date.now() + LIST_TTL_MS });
  return meta;
}

async function parentsOf(id) {
  const cached = parentCache.get(id);
  if (cached && Date.now() < cached.expiresAt) return cached.parents;

  const params = new URLSearchParams({
    fields: "parents",
    supportsAllDrives: "true",
  });
  const res = await driveFetch(`/files/${encodeURIComponent(id)}?${params}`);
  const parents = res.ok ? (await res.json()).parents || [] : [];

  parentCache.set(id, { parents, expiresAt: Date.now() + LIST_TTL_MS });
  return parents;
}

// Walks up the folder tree and returns which class folder this item lives
// under, or null if it lives outside all of them. Files nested in subfolders
// are as valid as files sitting directly in a class folder — what matters is
// that the chain reaches a folder we own.
export async function rootFolderOf(id, rootIds, maxDepth = 8) {
  const seen = new Set();
  let frontier = await parentsOf(id);

  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const hit = frontier.find((p) => rootIds.includes(p));
    if (hit) return hit;

    const next = [];
    for (const p of frontier) {
      if (seen.has(p)) continue;
      seen.add(p);
      next.push(...(await parentsOf(p)));
    }
    frontier = next;
  }

  return null;
}

// Resolves a file *and* proves it sits somewhere under one of our class
// folders. Without this check any verified student could pass an arbitrary
// Drive id and read whatever else the service account can see.
export async function resolveFile(fileId, allowedFolderIds) {
  const file = await getMeta(fileId);
  if (!file || file.trashed) return null;
  if (file.mimeType === FOLDER_MIME) return null;

  const folderId = await rootFolderOf(fileId, allowedFolderIds);
  if (!folderId) return null;

  // Staff sometimes use "Add shortcut to Drive" instead of moving a file. The
  // shortcut is what lives in our folder, so it is what gets access-checked —
  // but the bytes have to come from its target.
  if (file.mimeType === SHORTCUT_MIME) {
    const targetId = file.shortcutDetails?.targetId;
    if (!targetId) return null;

    const target = await getMeta(targetId);
    if (!target || target.trashed) return null;

    return {
      ...target,
      // Keep the name staff gave the shortcut — that is what students saw.
      name: file.name,
      folderId,
    };
  }

  return { ...file, folderId };
}

// Returns the raw upstream response so the route can pass the body straight
// through without buffering the whole PDF in memory.
// Where to send the student. webViewLink opens the Drive viewer and is
// correct for Docs and Sheets too, which do not live at /file/d/.
//
// This link only works while the folder is shared as
// "Anyone with the link - Viewer". Set it back to Restricted and every
// redirect lands on a Request Access screen.
export function driveUrl(file) {
  if (file.webViewLink) return file.webViewLink;
  return `https://drive.google.com/file/d/${file.id}/view`;
}
