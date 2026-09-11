import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D10" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Anveshaka — Autonomous Research Intelligence",
  description:
    "Autonomous research agent orchestrating deep web search, evidence distillation, and reflective synthesis to produce verified, fully cited reports. अन्वेषक — The one who investigates.",
  keywords: [
    "AI research",
    "autonomous agent",
    "LangGraph",
    "Gemini",
    "research intelligence",
    "knowledge synthesis",
    "cited reports",
  ],
  authors: [{ name: "Adetya Jamwal" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('anveshaka-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored === 'dark' || (!stored && prefersDark) || (stored === 'system' && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-[family-name:var(--font-inter)] selection:bg-accent/20 selection:text-accent">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
