// ---------------------------------------------------------------------------
// EDIT THIS FILE to add or rename classes.
//
// Files are no longer listed here — each class points at a Drive folder and
// the library lists whatever is inside it. To publish a new paper, drop the
// PDF into the folder in Drive. No code change, no deploy.
//
// Every folder must be shared with the service account
// (eduport-notes-reader@eduport-notes.iam.gserviceaccount.com) as Viewer, and
// otherwise set to "Restricted" so no public link exists.
// ---------------------------------------------------------------------------

// Subfolders of "Onam Exam Question Paper" (1L2PyJ6WEGn70IMoWCzGH42qib1liEQCL).
// The parent is shared with the service account as Viewer; these inherit it.
export const CLASSES = [
  {
    slug: "class-7",
    label: "Class 7",
    folderId: "1mQUfNOTQpRtDEg-jU2DAVj1tGF_kObK4",
  },
  {
    slug: "class-8",
    label: "Class 8",
    folderId: "1RZ9HiIQ4HgxvwTx7L76Rc6dP2lNDz5wt",
  },
  {
    slug: "class-9",
    label: "Class 9",
    folderId: "1sXLGJKcrfuUSJFYmFADsGiqrbMum_x1s",
  },
  {
    slug: "class-10",
    label: "Class 10",
    folderId: "1ndxPgi33iBJI5RR7YVn1dyQH4iLeb63T",
  },
];

export const BRAND = {
  name: "Eduport",
  site: "https://eduport.app",
  // The link students pass on to their friends — this app, not the main site.
  shareUrl: "https://onamexam.eduport.app",
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
