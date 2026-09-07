import { redirect, notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { getSession } from "@/lib/session";
import { allowedFolderIds, classForFolder, CLASSES } from "@/lib/config";
import { resolveFile, previewUrl } from "@/lib/drive";

export const dynamic = "force-dynamic";

// Reads a paper inside the app instead of throwing the student straight out
// to Drive. The iframe still pulls the bytes from Google, so this costs no
// more origin transfer than the old redirect did — the student simply keeps
// our header, the back link and the share prompt around them.
//
// "Open in Drive" is still one tap away, for downloading or printing.
export default async function ViewPage({ params, searchParams }) {
  const fileId = params.id;

  let file;
  try {
    file = await resolveFile(fileId, allowedFolderIds());
  } catch (err) {
    console.error("Drive lookup failed:", err);
    redirect("/library");
  }

  // Unknown id, trashed, or living outside our class folders.
  if (!file) notFound();

  // Same gate as /api/open — a shared link to this page gets a stranger the
  // OTP form, then lands them back here.
  const session = await getSession();
  if (!session) {
    const cls = classForFolder(file.folderId) || CLASSES[0];
    redirect(`/c/${cls.slug}?r=${file.id}`);
  }

  const cls = classForFolder(file.folderId) || CLASSES[0];
  const backHref = searchParams?.f
    ? `/library?c=${cls.slug}&f=${searchParams.f}`
    : `/library?c=${cls.slug}`;

  return (
    <Shell wide>
      <a
        href={backHref}
        className="text-[13px] text-ink-70 hover:text-brand transition-colors"
      >
        ← Back to {cls.label}
      </a>

      <h1 className="mt-1 font-display text-[18px] font-semibold leading-snug">
        {titleOf(file.name)}
      </h1>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink-10 bg-white shadow-card">
        <iframe
          src={previewUrl(file)}
          title={titleOf(file.name)}
          allow="autoplay"
          className="block h-[min(78dvh,900px)] w-full border-0"
        />
      </div>

      <a
        href={`/api/open/${file.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-50 text-[15px] font-medium text-brand-700 active:scale-[.99] transition-transform"
      >
        <DriveMark />
        Open in Drive
      </a>

      <p className="mt-2.5 text-center text-[12px] leading-relaxed text-ink-50">
        Open in Drive to download or print this paper.
      </p>
    </Shell>
  );
}

function DriveMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </svg>
  );
}

// Mirrors the library — "Physics Model Paper.pdf" reads as "Physics Model Paper".
function titleOf(name) {
  return String(name).replace(/\.[a-z0-9]{1,5}$/i, "");
}
