"use client";

import type { SubQuestion, Verdict } from "@/lib/types";

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
    // If no verdict yet, infer from pipeline stage
    if (activeStage === "Decompose" || activeStage === "Synthesize") return "pending";
    return "in_progress";
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "sufficient":
        return <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />;
      case "needs_more":
        return <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />;
      case "in_progress":
        return <div className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50 animate-pulse" />;
      default:
        return <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        Research Facets
      </h3>
      <div className="flex flex-col gap-2">
        {subQuestions.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-zinc-600">
            Sub-questions will appear here...
          </div>
        ) : (
          subQuestions.map((sq) => {
            const status = getStatus(sq.id);
            return (
              <div
                key={sq.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 px-4 py-3 transition-all duration-200 hover:border-zinc-700/50"
              >
                <div className="mt-1">{getStatusDot(status)}</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-zinc-200 leading-snug">
                    {sq.text}
                  </span>
                  {sq.parent_intent && (
                    <span className="text-xs text-zinc-500">{sq.parent_intent}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
