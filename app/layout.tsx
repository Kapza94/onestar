import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "onestar — competitors’ worst reviews, your product roadmap",
  description:
    "Discover what customers hate, what competitors ignore, and what your product should do differently.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-mono text-fg">{children}</body>
    </html>
  );
}
