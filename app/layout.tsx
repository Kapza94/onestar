import type { Metadata } from "next";
import { Archivo_Narrow, Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const grotesk = Bricolage_Grotesque({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const label = Archivo_Narrow({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OneStar — competitors’ worst reviews, your product roadmap",
  description:
    "Discover what customers hate, what competitors ignore, and what your product should do differently.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${serif.variable} ${label.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-fg">{children}</body>
    </html>
  );
}
