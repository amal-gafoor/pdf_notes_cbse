import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { allowedFolderIds, classForFolder, CLASSES } from "@/lib/config";
import { resolveFile, driveUrl } from "@/lib/drive";

export const dynamic = "force-dynamic";

// Sends the student to Drive instead of streaming the file through Vercel.
// No PDF bytes touch the platform, so this costs nothing in origin transfer.
//
// The session check still runs here, so sharing THIS url gets a stranger the
// gate. The Drive link it hands out afterwards is public and permanent — that
// is the accepted trade for removing the bandwidth cost.
export async function GET(req, { params }) {
  const fileId = params.slug;

  let file;
  try {
    file = await resolveFile(fileId, allowedFolderIds());
  } catch (err) {
    console.error("Drive lookup failed:", err);
    return NextResponse.redirect(new URL("/library", req.url));
  }

  // Unknown id, trashed, or living outside our class folders.
  if (!file) return NextResponse.redirect(new URL("/", req.url));

  const session = await getSession();
  if (!session) {
    const cls = classForFolder(file.folderId) || CLASSES[0];
    const url = new URL(`/c/${cls.slug}`, req.url);
    url.searchParams.set("r", file.id);
    return NextResponse.redirect(url);
  }

  const target = driveUrl(file);
  if (!target) return NextResponse.redirect(new URL("/library", req.url));

  return NextResponse.redirect(target);
}
