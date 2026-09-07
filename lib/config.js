// ---------------------------------------------------------------------------
// EDIT THIS FILE to add or rename classes.
//
// Files are no longer listed here — each class points at a Drive folder and
// the library lists whatever is inside it. To publish a new paper, drop the
// PDF into the folder in Drive. No code change, no deploy.
//
// Every folder must be shared with the service account
// (cbse-notes-reader@eduport-cbse-notes.iam.gserviceaccount.com) as Viewer so
// the library can list it, AND set to "Anyone with the link - Viewer" so the
// Drive urls /api/open hands out actually open for students.
// ---------------------------------------------------------------------------

// Subfolders of the CBSE notes parent (1lpmO2-AlILOek0ezeTyMopE9XoUK7Rfi).
// The parent is link-shared and also shared with the service account as
// Viewer; these inherit both.
export const CLASSES = [
  {
    slug: "class-7",
    label: "Class 7",
    folderId: "1ullHHQD9dgnlVay1hzV1rf3i1nJJRHzP",
  },
  {
    slug: "class-8",
    label: "Class 8",
    folderId: "1U_Q6Rh9q55HLW26-MwMv5H1dyF1LxELv",
  },
  {
    slug: "class-9",
    label: "Class 9",
    folderId: "10Czxf6SGVaDOmOWTtdyBImg1oZrjjPU7",
  },
  {
    slug: "class-10",
    label: "Class 10",
    folderId: "1UmMT91r14nn3iq4dX6JY7oCs_mHDT4pR",
  },
];

export const BRAND = {
  name: "Eduport",
  site: "https://eduport.app",
  // The link students pass on to their friends — this app, not the main site.
  shareUrl: "https://cbsehalfyearlyquestion.eduport.app",
  phone: "+919207998855",
  phoneLabel: "+91 92 07 99 88 55",
};

export function findClass(slug) {
  return CLASSES.find((c) => c.slug === slug) || null;
}

// Which folders /api/open is allowed to serve from.
export function allowedFolderIds() {
  return [...new Set(CLASSES.map((c) => c.folderId))];
}

export function classForFolder(folderId) {
  return CLASSES.find((c) => c.folderId === folderId) || null;
}

// ---------------------------------------------------------------------------
// Marketing / analytics tag IDs, read by components/Analytics.jsx.
//
// These are public by design — they ship to the browser, so NEXT_PUBLIC_* is
// correct and none of them is a secret. Set them in Vercel (or .env.local for
// dev); a blank ID means that tag simply does not render.
//
// If you go the GTM route, set only NEXT_PUBLIC_GTM_ID and add GA4 / Ads /
// Meta as tags inside the container — otherwise each event fires twice.
// ---------------------------------------------------------------------------
export const TRACKING = {
  // Our own one-liner: visitor -> lead + engagement into Salesforce.
  eduport: "https://bridge.eduport.in/eduport-track.js",

  // The CAPI dataset/pixel.
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "1444521724375873",

  // Fill these in when the IDs exist. G-XXXXXXX / AW-XXXXXXX / GTM-XXXXXXX.
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID || "",
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "",
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || "",
};
