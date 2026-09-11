"use client";

import type { ActivityEntry } from "@/lib/types";
import { useEffect, useRef } from "react";
import { Check, Loader2, Info, AlertTriangle, Terminal } from "lucide-react";

interface LiveActivityProps {
  entries: ActivityEntry[];
}

export default function LiveActivity({ entries }: LiveActivityProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getStatusBadge = (type: ActivityEntry["type"]) => {
    switch (type) {
      case "success":
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-success-subtle text-success border border-success/30">
            <Check className="h-3 w-3 stroke-[2.5]" />
          </div>
        );
      case "progress":
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent border border-accent/30">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        );
      case "error":
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-error-subtle text-error border border-error/30">
            <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface text-text-muted border border-border">
            <Info className="h-3 w-3" />
          </div>
        );
    }
  };

  const formatTime = (d: Date) => {
    return new Date(d).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-secondary/40">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-text-muted" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-semibold">
            Execution Log
          </h3>
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          {entries.length} {entries.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto max-h-[380px] min-h-[220px] space-y-2 font-sans"
      >
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center text-text-muted">
            <div className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center mb-2">
              <Terminal className="h-4 w-4 opacity-40" />
            </div>
            <p className="text-xs font-mono">Telemetry idle. Awaiting research query.</p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={entry.id || idx}
              className="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-surface-secondary p-2.5 text-xs transition-colors"
            >
              {getStatusBadge(entry.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="font-mono text-[10px] text-text-muted">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p
                  className={`leading-relaxed break-words ${
                    entry.type === "error"
                      ? "text-error font-medium"
                      : entry.type === "progress"
                      ? "text-accent font-medium"
                      : "text-text-primary"
                  }`}
                >
                  {entry.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
