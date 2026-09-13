"use client";

import type { StageState } from "@/lib/types";
import { Check } from "lucide-react";

interface PipelineTrackerProps {
  stages: StageState[];
}

export default function PipelineTracker({ stages }: PipelineTrackerProps) {
  return (
    <div className="w-full py-6" role="region" aria-label="Expedition Pipeline Ledger">
      <div className="flex items-center w-full">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === "completed";
          const isActive = stage.status === "active";
          const isPending = stage.status === "pending";

          return (
            <div key={stage.name} className="flex items-center flex-1 last:flex-none">
              {/* Stage Node */}
              <div className="flex flex-col gap-1.5 min-w-[100px]">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-[18px] w-[18px] items-center justify-center border transition-all duration-300 font-mono text-[9px] font-semibold tracking-wider ${
                      isCompleted
                        ? "bg-success border-success text-background"
                        : isActive
                        ? "bg-accent border-accent text-background"
                        : "bg-transparent border-border text-text-muted border-dashed"
                    }`}
                    aria-label={`${stage.name} stage: ${stage.status}`}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3 stroke-[3]" />
                    ) : (
                      <span>0{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] uppercase tracking-wider font-semibold ${
                      isCompleted
                        ? "text-text-primary"
                        : isActive
                        ? "text-accent"
                        : "text-text-muted"
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
              </div>

              {/* Connecting Rule */}
              {index < stages.length - 1 && (
                <div className="flex-1 mx-4 -mt-[18px]">
                  <div className="h-[1px] w-full bg-border">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        isCompleted
                          ? "w-full bg-success"
                          : isActive
                          ? "w-1/2 bg-accent"
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
