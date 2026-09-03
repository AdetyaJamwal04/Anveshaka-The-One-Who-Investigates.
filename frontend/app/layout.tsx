import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anveshaka — Autonomous Research Agent",
  description:
    "AI-powered deep research agent that autonomously searches, analyzes, and synthesizes comprehensive reports with full citations. अन्वेषक — The one who investigates.",
  keywords: [
    "AI research",
    "autonomous agent",
    "LangGraph",
    "Gemini",
    "research automation",
    "cited reports",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-zinc-50 font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
