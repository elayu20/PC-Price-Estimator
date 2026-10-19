import Link from "next/link";
import { Archivo } from "next/font/google";
import "./globals.css";

// Variable width axis, so headings can use the condensed cut (font-stretch)
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });

export const metadata = {
  title: "PC Price Estimator",
  description: "Pick PC parts, check compatibility and see what they sell for on eBay Canada.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b-2 border-ink bg-guide">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
            <Link href="/" className="guide-head text-xl leading-none tracking-wide whitespace-nowrap sm:text-3xl">
              PC Price Estimator
            </Link>
            <span className="hidden border-[1.5px] border-ink px-2 py-0.5 text-xs font-semibold md:inline">
              eBay.ca market values, CAD
            </span>
            <nav className="ml-auto flex items-center gap-4 text-sm font-semibold whitespace-nowrap sm:gap-5">
              <Link href="/" className="underline-offset-4 hover:underline">New build</Link>
              {/* A plain link, so it scrolls on the current page instead of going to "/" */}
              <a href="#my-builds" className="underline-offset-4 hover:underline">My Builds</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-7xl border-t border-rule px-4 pt-6 pb-28 text-xs text-muted sm:px-6 lg:pb-10">
          Part data from{" "}
          <a href="https://github.com/docyx/pc-part-dataset" className="underline underline-offset-2 hover:text-ink">
            docyx/pc-part-dataset
          </a>
          . Prices are medians of filtered new and used eBay.ca listings, in CAD, before shipping, duty and brokerage.
        </footer>
      </body>
    </html>
  );
}
