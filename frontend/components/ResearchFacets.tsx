"use client";

import type { SubQuestion, Verdict } from "@/lib/types";
import { GitFork, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ResearchFacetsProps {
  subQuestions: SubQuestion[];
  verdicts: Verdict[];
  activeStage: string;
}

export default function ResearchFacets({
  subQuestions,
  verdicts,
  activeStage,
}: ResearchFacetsProps) {
  const getStatus = (sqId: string) => {
    const verdict = verdicts.find((v) => v.sub_question_id === sqId);
    if (verdict) {
      return verdict.verdict === "sufficient" ? "sufficient" : "needs_more";
    }
    if (activeStage === "Decompose" || activeStage === "Synthesize") return "pending";
    return "in_progress";
  };

  const renderStatusPill = (status: string) => {
    switch (status) {
      case "sufficient":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-success-subtle text-success border border-success/30">
            <CheckCircle2 className="h-3 w-3" />
            <span>Sufficient</span>
          </span>
        );
      case "needs_more":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-subtle text-amber border border-amber/30">
            <AlertCircle className="h-3 w-3" />
            <span>Gap Flagged</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-accent-subtle text-accent border border-accent/30">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Searching</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-surface text-text-muted border border-border">
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-secondary/40">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-text-muted" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-semibold">
            Decomposed Facets
          </h3>
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          {subQuestions.length} {subQuestions.length === 1 ? "branch" : "branches"}
        </span>
      </div>

      {/* Facet List */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[380px] min-h-[220px] space-y-2.5">
        {subQuestions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center text-text-muted">
            <div className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center mb-2">
              <GitFork className="h-4 w-4 opacity-40" />
            </div>
            <p className="text-xs font-mono">No facets decomposed yet.</p>
          </div>
        ) : (
          subQuestions.map((sq, idx) => {
            const status = getStatus(sq.id);
            return (
              <div
                key={sq.id || idx}
                className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-secondary p-3 text-xs transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-text-muted">
                    Facet 0{idx + 1} · {sq.id}
                  </span>
                  {renderStatusPill(status)}
                </div>

                <p className="text-sm font-medium text-text-primary leading-snug">
                  {sq.text}
                </p>

                {sq.parent_intent && (
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-text-muted">
                    <span className="uppercase text-[9px] font-mono tracking-wider text-text-muted">Intent:</span>
                    <span className="capitalize text-text-secondary font-medium">{sq.parent_intent}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
