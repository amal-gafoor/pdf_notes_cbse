import Logo from "./Logo";
import { BRAND } from "@/lib/config";

export default function Shell({ children }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-center">
        <a href={BRAND.site} aria-label="Eduport home">
          <Logo className="h-9" />
        </a>
      </header>

      <main className="flex-1 px-5 pb-8 w-full max-w-[26rem] mx-auto">
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