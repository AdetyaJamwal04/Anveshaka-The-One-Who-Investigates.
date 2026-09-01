"use client";

import type { ActivityEntry } from "@/lib/types";
import { useEffect, useRef } from "react";

interface LiveActivityProps {
  entries: ActivityEntry[];
}

export default function LiveActivity({ entries }: LiveActivityProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getIcon = (type: ActivityEntry["type"]) => {
    switch (type) {
      case "success":
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        );
      case "progress":
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
            <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          </div>
        );
      case "info":
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
          </div>
        );
      case "error":
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-3 w-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        Live Activity
      </h3>
      <div
        ref={scrollRef}
        className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin"
      >
        {entries.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-zinc-600">
            Waiting for research to begin...
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 px-4 py-3 transition-all duration-300 animate-in fade-in slide-in-from-top-1"
            >
              {getIcon(entry.type)}
              <span
                className={`text-sm leading-relaxed ${
                  entry.type === "progress"
                    ? "text-violet-300"
                    : entry.type === "error"
                    ? "text-red-300"
                    : "text-zinc-300"
                }`}
              >
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
