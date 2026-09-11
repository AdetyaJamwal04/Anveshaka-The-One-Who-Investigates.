"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Light mode" },
    { value: "system" as const, icon: Monitor, label: "System theme" },
    { value: "dark" as const, icon: Moon, label: "Dark mode" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      suppressHydrationWarning
      className={`inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5 text-text-muted ${className}`}
    >
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
              isActive
                ? "bg-surface-elevated text-text-primary shadow-xs border border-border font-semibold"
                : "text-text-muted hover:text-text-primary hover:bg-surface-secondary/60"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
