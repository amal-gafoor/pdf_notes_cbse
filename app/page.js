import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { CLASSES } from "@/lib/config";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/library");

  return (
    <Shell>
      <h1 className="font-display text-[22px] font-semibold leading-snug">
        Free Onam Exam Notes, Model Question Papers, Micro bits
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-70">
        Select your class to begin
      </p>

      <ul className="mt-6 space-y-2.5">
        {CLASSES.map((c) => (
          <li key={c.slug}>
            <a
              href={`/c/${c.slug}`}
              className="flex h-14 items-center justify-between rounded-2xl bg-white px-5 shadow-card active:scale-[.99] transition-transform"
            >
              <span className="font-display text-[16px] font-medium">
                {c.label}
              </span>
              <span aria-hidden="true" className="text-brand">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Shell>
  );
}