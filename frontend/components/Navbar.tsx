"use client";

import Link from "next/link";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Beaker, FileText, Database } from "lucide-react";

export default function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();

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
          <a href="#" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-primary border-b-2 border-accent pb-1 -mb-1">
            <Beaker className="h-3.5 w-3.5" />
            Active Expeditions
          </a>
          <a href="#" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted opacity-50 cursor-not-allowed" title="Coming Soon" onClick={(e) => e.preventDefault()}>
            <FileText className="h-3.5 w-3.5" />
            Primary Dossiers
          </a>
          <a href="#" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted opacity-50 cursor-not-allowed" title="Coming Soon" onClick={(e) => e.preventDefault()}>
            <Database className="h-3.5 w-3.5" />
            Provenance
          </a>
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
