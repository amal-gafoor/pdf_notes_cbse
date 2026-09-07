import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import ShareWhatsApp from "@/components/ShareWhatsApp";
import { getSession } from "@/lib/session";
import { findClass, CLASSES } from "@/lib/config";
import { listFolder, getMeta, rootFolderOf } from "@/lib/drive";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your free model question papers · Eduport" };

export default async function Library({ searchParams }) {
  const session = await getSession();
  if (!session) redirect(`/c/${searchParams?.c || CLASSES[0].slug}`);

  const cls = findClass(searchParams?.c || session.cls) || CLASSES[0];
  const firstName = String(session.name || "").split(" ")[0];

  // ?f= lets students walk into subfolders. It is checked against the class
  // tree so it cannot be pointed at some other folder in Drive.
  let folderId = cls.folderId;
  let folderName = "";
  let backHref = `/library?c=${cls.slug}`;
  const wanted = searchParams?.f;

  let listing = { folders: [], files: [] };
  let failed = false;

  try {
    if (wanted && wanted !== cls.folderId) {
      const inside = await rootFolderOf(wanted, [cls.folderId]);
      const meta = inside ? await getMeta(wanted) : null;
      if (meta && !meta.trashed) {
        folderId = wanted;
        folderName = meta.name;
        // Papers sit two levels down (MODEL QUESTION PAPER / ARABIC / file),
        // so step back one level rather than all the way to the class root.
        const parent = (meta.parents || [])[0];
        if (parent && parent !== cls.folderId) {
          backHref = `/library?c=${cls.slug}&f=${parent}`;
        }
      }
    }
    // A Drive hiccup should show an empty shelf, never a 500.
    listing = await listFolder(folderId);
  } catch (err) {
    console.error("Could not list Drive folder:", err);
    failed = true;
  }

  const { folders, files } = listing;
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-[15px] font-semibold text-brand-700">
          {firstName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="font-display text-[17px] font-semibold leading-tight">
            Hi {firstName}
          </p>
          <p className="text-[13px] text-ink-70">{cls.label}</p>
        </div>
      </div>

      {folderName && (
        <div className="mt-5">
          <a
            href={backHref}
            className="text-[13px] text-ink-70 hover:text-brand transition-colors"
          >
            ← Back
          </a>
          <p className="mt-1 font-display text-[18px] font-semibold leading-snug">
            {folderName}
          </p>
        </div>
      )}

      {isEmpty ? (
        <p className="mt-6 rounded-2xl border border-ink-10 p-5 text-center text-[14px] leading-relaxed text-ink-70">
          {failed
            ? "We could not load your papers just now. Please try again in a minute."
            : `${folderName || cls.label} papers are being added. Check back soon.`}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {folders.map((folder) => (
            <li key={folder.id}>
              <a
                href={`/library?c=${cls.slug}&f=${folder.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-card active:scale-[.99] transition-transform"
              >
                <FolderIcon />
                <span className="font-display text-[16px] font-medium leading-snug">
                  {folder.name}
                </span>
                <span aria-hidden="true" className="ml-auto text-brand">
                  →
                </span>
              </a>
            </li>
          ))}

          {files.map((file) => (
            <li
              key={file.id}
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-card"
            >
              <span className="cap-corner" aria-hidden="true" />
              <p className="font-display text-[16px] font-medium leading-snug">
                {titleOf(file.name)}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-50">{metaOf(file)}</p>
              <a
                href={`/view/${file.id}${folderName ? `?f=${folderId}` : ""}`}
                className="mt-4 grid h-11 place-items-center rounded-xl border border-brand/30 bg-brand-50 text-[14px] font-medium text-brand-700 active:scale-[.99] transition-transform"
              >
                Open PDF
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <ShareWhatsApp />
        <p className="mt-2.5 text-center text-[12px] text-ink-50">
          Send these papers to a friend who needs them.
        </p>
      </div>
    </Shell>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0 text-brand"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
    </svg>
  );
}

// "Physics Model Paper.pdf" reads better as "Physics Model Paper".
function titleOf(name) {
  return String(name).replace(/\.[a-z0-9]{1,5}$/i, "");
}

function metaOf(file) {
  const kind = file.mimeType?.includes("pdf")
    ? "PDF"
    : file.mimeType?.startsWith("application/vnd.google-apps")
      ? "Google Doc"
      : "File";
  const size = Number(file.size);
  if (!size) return kind;
  const mb = size / (1024 * 1024);
  return `${kind} · ${mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(size / 1024)} KB`}`;
}
