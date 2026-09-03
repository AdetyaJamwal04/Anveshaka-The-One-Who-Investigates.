"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PipelineTracker from "@/components/PipelineTracker";
import LiveActivity from "@/components/LiveActivity";
import ResearchFacets from "@/components/ResearchFacets";
import { streamResearch } from "@/lib/api";
import type {
  StageState,
  PipelineStage,
  SubQuestion,
  Verdict,
  ActivityEntry,
  ResearchStats,
  SSEEvent,
} from "@/lib/types";
import { Send, Loader2, Check, Copy, Download } from "lucide-react";
import ExportPdfButton from "@/components/ExportPdfButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const INITIAL_STAGES: StageState[] = [
  { name: "Synthesize", status: "pending" },
  { name: "Decompose", status: "pending" },
  { name: "Search", status: "pending" },
  { name: "Extract", status: "pending" },
  { name: "Reflect", status: "pending" },
  { name: "Report", status: "pending" },
];

const STAGE_ORDER: PipelineStage[] = [
  "Synthesize",
  "Decompose",
  "Search",
  "Extract",
  "Reflect",
  "Report",
];

/** Cross-device clipboard copy with HTTPS fallback */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      // Modern Clipboard API (requires HTTPS on non-localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP / older browsers / mobile
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
        document.body.appendChild(textarea);
        textarea.select();
        // iOS Safari requires setSelectionRange
        textarea.setSelectionRange(0, text.length);
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: prompt user to copy manually
      window.prompt("Copy this report:", text.substring(0, 2000));
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy Report
        </>
      )}
    </button>
  );
}

/** Cross-device download with iOS Safari fallback */
function DownloadButton({ report }: { report: string }) {
  const handleDownload = useCallback(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      // iOS Safari blocks blob downloads; open in a new tab instead
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(
          "<html><head><title>anveshaka-report.md</title>" +
          "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
          "</head><body><pre style=\"white-space:pre-wrap;word-wrap:break-word;font-family:monospace;padding:1rem;\">" +
          report.replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "</pre></body></html>"
        );
        win.document.close();
      }
    } else {
      // Standard download for Chrome, Firefox, Edge, Android
      const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "anveshaka-report.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Delay revoke to allow download to start
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }, [report]);

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
    >
      <Download className="h-3 w-3" />
      Download
    </button>
  );
}

export default function ResearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [stages, setStages] = useState<StageState[]>(INITIAL_STAGES);
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [stats, setStats] = useState<ResearchStats>({
    roundNum: 0,
    maxRounds: 3,
    queryCount: 0,
    evidenceCount: 0,
    sourceCount: 0,
  });
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string>("Synthesize");
  const cleanupRef = useRef<(() => void) | null>(null);
  const entryIdRef = useRef(0);

  const addActivity = useCallback(
    (message: string, type: ActivityEntry["type"] = "success") => {
      const id = `entry-${entryIdRef.current++}`;
      setActivityLog((prev) => [
        ...prev,
        { id, timestamp: new Date(), message, type },
      ]);
    },
    []
  );

  const updateStages = useCallback(
    (completedStage: PipelineStage, nextStage?: PipelineStage) => {
      setStages((prev) =>
        prev.map((s) => {
          if (s.name === completedStage) return { ...s, status: "completed" };
          if (nextStage && s.name === nextStage) return { ...s, status: "active" };
          return s;
        })
      );
    },
    []
  );

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      const stage = event.stage as PipelineStage;
      const stageIndex = STAGE_ORDER.indexOf(stage);
      const nextStage = stageIndex < STAGE_ORDER.length - 1 ? STAGE_ORDER[stageIndex + 1] : undefined;

      // Final report
      if (event.node === "END" && event.report) {
        let reportText = "";
        if (typeof event.report === "string") {
          reportText = event.report;
        } else if (Array.isArray(event.report)) {
          reportText = (event.report as any[])
            .map((p) => (typeof p === "string" ? p : p?.text || JSON.stringify(p)))
            .join("");
        } else if (typeof event.report === "object" && (event.report as any)?.text) {
          reportText = String((event.report as any).text);
        } else {
          reportText = String(event.report);
        }

        setReport(reportText);
        setStages((prev) => prev.map((s) => ({ ...s, status: "completed" })));
        addActivity("Research complete! Report generated.", "success");
        return;
      }

      // Mark stage completed and next active
      updateStages(stage, nextStage);
      setCurrentStage(nextStage || "Complete");

      // Process enriched data
      if (event.sub_questions) {
        setSubQuestions(event.sub_questions);
        addActivity(
          `Generated ${event.sub_questions.length} sub-questions`,
          "success"
        );
      }

      if (event.query_count) {
        setStats((prev) => ({ ...prev, queryCount: prev.queryCount + event.query_count! }));
        addActivity(
          `Created ${event.query_count} search queries`,
          "success"
        );
      }

      if (event.result_count) {
        addActivity(
          `Retrieved ${event.result_count} clean search results`,
          "success"
        );
      }

      if (event.evidence_count !== undefined) {
        setStats((prev) => ({
          ...prev,
          evidenceCount: event.evidence_count!,
          sourceCount: event.source_count || prev.sourceCount,
        }));
        addActivity(
          `Extracted evidence — ${event.evidence_count} total claims from ${event.source_count || 0} sources`,
          "success"
        );
      }

      if (event.round_num) {
        setStats((prev) => ({ ...prev, roundNum: event.round_num! }));
      }

      if (event.verdicts) {
        setVerdicts(event.verdicts);
        const weak = event.verdicts.filter((v) => v.verdict === "needs_more").length;
        if (weak > 0) {
          addActivity(
            `Reflection: ${weak} sub-question${weak > 1 ? "s" : ""} need${weak === 1 ? "s" : ""} more evidence — iterating...`,
            "progress"
          );
        } else {
          addActivity(
            "Reflection: All sub-questions have sufficient evidence!",
            "success"
          );
        }
      }

      // Generic stage completion log if no specific data
      if (
        !event.sub_questions &&
        !event.query_count &&
        !event.result_count &&
        event.evidence_count === undefined &&
        !event.verdicts &&
        event.node !== "END"
      ) {
        addActivity(`${stage} stage completed`, "info");
      }
    },
    [addActivity, updateStages]
  );

  const startResearch = useCallback(() => {
    if (!query.trim() || isResearching) return;

    // Reset state
    setIsResearching(true);
    setStages(
      INITIAL_STAGES.map((s, i) =>
        i === 0 ? { ...s, status: "active" } : s
      )
    );
    setSubQuestions([]);
    setVerdicts([]);
    setActivityLog([]);
    setStats({
      roundNum: 1,
      maxRounds: 3,
      queryCount: 0,
      evidenceCount: 0,
      sourceCount: 0,
    });
    setReport(null);
    setError(null);
    setCurrentStage("Synthesize");

    addActivity(`Starting research: "${query}"`, "progress");

    const cleanup = streamResearch(
      query,
      handleEvent,
      (err) => {
        setError(err);
        setIsResearching(false);
        addActivity(`Error: ${err}`, "error");
      },
      () => {
        setIsResearching(false);
      }
    );

    cleanupRef.current = cleanup;
  }, [query, isResearching, addActivity, handleEvent]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* ── Query Input ──────────────────────────────── */}
          <div className="mb-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-blue-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300" />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startResearch();
                }}
                className="relative flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 focus-within:border-violet-500/50 transition-colors"
              >
                <input
                  type="text"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      startResearch();
                    }
                  }}
                  placeholder="What would you like to research?"
                  disabled={isResearching}
                  className="flex-1 bg-transparent text-base text-white placeholder:text-zinc-500 outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isResearching}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/40 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  {isResearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── Pipeline Tracker ─────────────────────────── */}
          <PipelineTracker stages={stages} />

          {/* ── Stats Bar ────────────────────────────────── */}
          {isResearching && (
            <div className="flex items-center justify-center gap-4 md:gap-8 py-3 mb-6 text-sm text-zinc-500">
              <span>
                Round{" "}
                <span className="text-zinc-300 font-medium">
                  {stats.roundNum}
                </span>{" "}
                of {stats.maxRounds}
              </span>
              <span className="text-zinc-700">·</span>
              <span>
                <span className="text-zinc-300 font-medium">
                  {stats.queryCount}
                </span>{" "}
                queries
              </span>
              <span className="text-zinc-700">·</span>
              <span>
                <span className="text-zinc-300 font-medium">
                  {stats.evidenceCount}
                </span>{" "}
                evidence claims
              </span>
              <span className="text-zinc-700 hidden md:inline">·</span>
              <span className="hidden md:inline">
                <span className="text-zinc-300 font-medium">
                  {stats.sourceCount}
                </span>{" "}
                sources
              </span>
            </div>
          )}

          {/* ── Error Banner ─────────────────────────────── */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-5 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ── Report View (when complete) ──────────────── */}
          {report && (
            <div className="mb-8 rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-400">
                    Research Complete
                  </span>
                </div>
                <div className="flex gap-2">
                  <CopyButton text={report} />
                  <DownloadButton report={report} />
                  <ExportPdfButton title={query || "Anveshaka Research Report"} />
                </div>
              </div>
              <div className="hidden print:block print-only-header mb-6">
                <div className="flex justify-between items-center text-xs text-zinc-500 uppercase tracking-widest mb-1">
                  <span className="font-bold text-zinc-900">Anveshaka · Autonomous Research Intelligence</span>
                  <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="text-xs text-zinc-600">Cited Exhaustive Research Dossier</div>
              </div>
              <div className="report-content max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {typeof report === "string" ? report : String(report || "")}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* ── Two Column Layout ────────────────────────── */}
          {(isResearching || activityLog.length > 0) && !report && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
              <LiveActivity entries={activityLog} />
              <ResearchFacets
                subQuestions={subQuestions}
                verdicts={verdicts}
                activeStage={currentStage}
              />
            </div>
          )}

          {/* ── Empty State ──────────────────────────────── */}
          {!isResearching && activityLog.length === 0 && !report && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
                <Send className="h-7 w-7 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-300 mb-2">
                Ready to investigate
              </h2>
              <p className="text-sm text-zinc-500 max-w-md">
                Enter a research question above. Anveshaka will autonomously
                decompose it, search the web, extract evidence, and generate a
                comprehensive cited report.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {[
                  "Impact of quantum computing on cryptography",
                  "Compare GLP-1 vs SGLT2 inhibitors for diabetes",
                  "Effects of social media on adolescent mental health",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setQuery(example)}
                    className="rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-300 hover:bg-zinc-800/50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
