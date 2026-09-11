"use client";

import type { StageState } from "@/lib/types";
import { Check, Loader2 } from "lucide-react";

interface PipelineTrackerProps {
  stages: StageState[];
}

export default function PipelineTracker({ stages }: PipelineTrackerProps) {
  return (
    <div className="w-full py-4 px-1" role="region" aria-label="Investigation Pipeline Execution">
      {/* Step progression row */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === "completed";
          const isActive = stage.status === "active";

          return (
            <div key={stage.name} className="flex items-center flex-1 last:flex-none">
              {/* Stage Node */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 min-w-[54px] sm:min-w-[70px]">
                <div
                  className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border text-xs font-mono transition-all duration-300 ${
                    isCompleted
                      ? "border-success/60 bg-success-subtle text-success font-semibold"
                      : isActive
                      ? "border-accent bg-accent-subtle text-accent font-semibold ring-2 ring-accent/20"
                      : "border-border bg-surface text-text-muted"
                  }`}
                  aria-label={`${stage.name} stage: ${stage.status}`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : (
                    <span>0{index + 1}</span>
                  )}
                </div>

                {/* Stage Title */}
                <span
                  className={`text-[11px] sm:text-xs tracking-tight transition-colors duration-200 text-center ${
                    isCompleted
                      ? "text-text-primary font-medium"
                      : isActive
                      ? "text-accent font-semibold"
                      : "text-text-muted"
                  }`}
                >
                  {stage.name}
                </span>
              </div>

              {/* Connecting Rule */}
              {index < stages.length - 1 && (
                <div className="flex-1 mx-1.5 sm:mx-3 -mt-5">
                  <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        isCompleted
                          ? "w-full bg-success"
                          : isActive
                          ? "w-1/2 bg-accent animate-pulse"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
