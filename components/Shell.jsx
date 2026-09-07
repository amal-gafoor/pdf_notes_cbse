import Logo from "./Logo";
import { BRAND } from "@/lib/config";

// `wide` drops the reading-width cap — the PDF viewer needs the whole screen,
// everything else reads better narrow.
export default function Shell({ children, wide = false }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-center">
        <a href={BRAND.site} aria-label="Eduport home">
          <Logo className="h-9" />
        </a>
      </header>

      <main
        className={`flex-1 px-5 pb-8 w-full mx-auto ${
          wide ? "max-w-[56rem]" : "max-w-[26rem]"
        }`}
      >
        {children}
      </main>

      <footer className="px-5 pb-7 text-center">
        <p className="text-[12px] leading-relaxed text-ink-50">
          Eduport Academy Private Limited · Kerala
          <br />
          Your number is used only to send this code and course updates.
        </p>
      </footer>
    </div>
  );
}