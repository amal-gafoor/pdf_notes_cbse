import { Outfit, Inter } from "next/font/google";
import Analytics from "@/components/Analytics";
import "./globals.css";

const display = Outfit({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Eduport free model question papers",
  description:
    "Free chapter notes, question papers and mind maps for Kerala students.",
  // The tab icon comes from app/icon.svg via Next's file convention — an
  // explicit icons entry here would override it.
};

// themeColor belongs here, not in metadata — Next 14 warns on every render
// otherwise, which floods the production logs.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF6518",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans min-h-dvh">
        {/* First child of <body> — where the GTM noscript frame belongs. */}
        <Analytics />
        {children}
      </body>
    </html>
  );
}