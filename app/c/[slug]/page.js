import { redirect, notFound } from "next/navigation";
import Shell from "@/components/Shell";
import Gate from "@/components/Gate";
import { findClass, CLASSES } from "@/lib/config";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CLASSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const cls = findClass(params.slug);
  return { title: cls ? `${cls.label} notes · Eduport` : "Eduport" };
}

export default async function GatePage({ params, searchParams }) {
  const cls = findClass(params.slug);
  if (!cls) notFound();

  const wanted = searchParams?.r || "";

  // Already verified on this browser — no second OTP, ever.
  const session = await getSession();
  if (session) {
    redirect(wanted ? `/api/open/${wanted}` : `/library?c=${params.slug}`);
  }

  return (
    <Shell>
      <Gate
        classSlug={cls.slug}
        className={cls.label}
        resource={wanted}
        otpLength={Number(process.env.OTP_LENGTH || 4)}
      />
    </Shell>
  );
}