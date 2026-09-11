"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { healthCheck } from "@/lib/api";
import { Compass, FileText, Cpu, Menu, X, ArrowUpRight } from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const res = await healthCheck();
        if (mounted) {
          setBackendStatus(res.status === "ok" ? "online" : "offline");
        }
      } catch {
        if (mounted) {
          setBackendStatus("offline");
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: "Investigate", href: "/research", icon: Compass },
    { label: "Archive", href: "/reports", icon: FileText },
    { label: "Architecture", href: "/#pipeline", icon: Cpu },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border text-accent group-hover:border-accent group-hover:bg-accent/10 transition-colors shadow-xs">
              <Compass className="h-4 w-4 transition-transform group-hover:rotate-45" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold tracking-tight text-text-primary">
                Anveshaka
              </span>
              <span className="text-[11px] font-medium text-text-muted px-1.5 py-0.5 rounded-sm bg-surface border border-border-subtle tracking-wide">
                अन्वेषक
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 pl-4 border-l border-border">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-surface text-text-primary border border-border"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-accent" : "text-text-muted"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Telemetry / Status, Theme & Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Live System Health Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-surface border border-border"
            title={`API Pipeline is ${backendStatus}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                backendStatus === "online"
                  ? "bg-success animate-pulse"
                  : backendStatus === "checking"
                  ? "bg-amber"
                  : "bg-error"
              }`}
            />
            <span className="text-text-muted capitalize">
              {backendStatus === "online" ? "Engine Ready" : backendStatus}
            </span>
          </div>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* GitHub Repo */}
          <a
            href="https://github.com/AdetyaJamwal04/Anveshaka-The-One-Who-Investigates."
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:border-border hover:bg-surface-secondary transition-colors"
            title="View source on GitHub"
            aria-label="GitHub repository"
          >
            <GithubIcon className="h-4 w-4" />
          </a>

          {/* Primary Action Button */}
          {pathname !== "/research" && (
            <Link
              href="/research"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors shadow-xs cursor-pointer"
            >
              <span>New Dossier</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-surface-elevated text-text-primary border border-border"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-text-muted"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === "online" ? "bg-success" : "bg-error"
                }`}
              />
              <span>Engine {backendStatus}</span>
            </div>
            <a
              href="https://github.com/AdetyaJamwal04/Anveshaka-The-One-Who-Investigates."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>Source</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
