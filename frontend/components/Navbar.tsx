"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Beaker, FileText, Database } from "lucide-react";

export default function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-4 hover:opacity-85 transition-opacity">
          <div className="flex flex-col">
            <h1 className="font-serif text-xl font-medium text-text-primary tracking-tight">
              ANVESHAKA <span className="text-text-muted text-sm tracking-normal font-sans ml-1">// 01</span>
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mt-0.5">
              Autonomous Research Expedition
            </span>
          </div>
        </Link>

        {/* Minimal Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/research"
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors pb-1 -mb-1 ${
              pathname === "/" || pathname === "/research"
                ? "text-text-primary border-b-2 border-accent"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Beaker className="h-3.5 w-3.5" />
            Active Expeditions
          </Link>
          <Link
            href="/reports"
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors pb-1 -mb-1 ${
              pathname.startsWith("/report")
                ? "text-text-primary border-b-2 border-accent"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Primary Dossiers
          </Link>
          <span
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted opacity-60 cursor-default"
            title="Evidence provenance & multi-provider audit active"
          >
            <Database className="h-3.5 w-3.5" />
            Provenance
          </span>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          
          <Link
            href="/"
            className="px-4 py-2 bg-accent text-background text-xs font-semibold uppercase tracking-wider border border-accent hover:bg-accent-hover transition-colors inline-block"
          >
            New Expedition
          </Link>
        </div>
      </div>
    </header>
  );
}
