"use client";

import type { StageState } from "@/lib/types";

interface PipelineTrackerProps {
  stages: StageState[];
}

export default function PipelineTracker({ stages }: PipelineTrackerProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center flex-1 last:flex-none">
            {/* Stage circle + label */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`
                  relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500
                  ${
                    stage.status === "completed"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : stage.status === "active"
                      ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/30"
                      : "border-zinc-700 bg-zinc-900"
                  }
                `}
              >
                {stage.status === "completed" ? (
                  <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : stage.status === "active" ? (
                  <>
                    <div className="absolute inset-0 animate-ping rounded-full border-2 border-violet-500 opacity-30" />
                    <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse" />
                  </>
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                )}
              </div>

              <span
                className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                  stage.status === "completed"
                    ? "text-emerald-400"
                    : stage.status === "active"
                    ? "text-violet-400"
                    : "text-zinc-500"
                }`}
              >
                {stage.name}
              </span>
            </div>

            {/* Connector line */}
            {index < stages.length - 1 && (
              <div className="flex-1 mx-3 mt-[-1.5rem]">
                <div className="h-0.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      stage.status === "completed"
                        ? "w-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : stage.status === "active"
                        ? "w-1/2 bg-gradient-to-r from-violet-500 to-violet-400 animate-pulse"
                        : "w-0"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
