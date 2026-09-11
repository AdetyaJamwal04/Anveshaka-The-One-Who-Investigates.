"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import PipelineTracker from "@/components/PipelineTracker";
import LiveActivity from "@/components/LiveActivity";
import ResearchFacets from "@/components/ResearchFacets";
import ExportPdfButton from "@/components/ExportPdfButton";
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
import {
  Search,
  Loader2,
  Copy,
  Check,
  Download,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

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

const CURATED_RESEARCH_TOPICS = [
  "Compare clinical efficacy of GLP-1 agonists vs SGLT2 inhibitors in cardiometabolic outcomes",
  "Impact of high-frequency algorithmic trading on equity market liquidity and flash crashes",
  "Longitudinal effects of microplastics on human endocrine disruption and cellular inflammation",
  "Techno-economic comparison of sodium-ion vs lithium iron phosphate batteries for grid storage",
];

function ResearchConsole() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
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
  const [copied, setCopied] = useState(false);
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

      // Final report completion
      if (event.node === "END" && event.report) {
        setReport(String(event.report));
        setStages((prev) => prev.map((s) => ({ ...s, status: "completed" })));
        addActivity("Autonomous investigation complete. Synthesis finalized.", "success");
        return;
      }

      // Progress node
      updateStages(stage, nextStage);
      setCurrentStage(nextStage || "Complete");

      if (event.sub_questions) {
        setSubQuestions(event.sub_questions);
        addActivity(
          `Query decomposed into ${event.sub_questions.length} distinct research facets`,
          "success"
        );
      }

      if (event.query_count) {
        setStats((prev) => ({ ...prev, queryCount: prev.queryCount + event.query_count! }));
        addActivity(
          `Formulated ${event.query_count} targeted web queries for active facets`,
          "success"
        );
      }

      if (event.result_count) {
        addActivity(
          `Retrieved and filtered ${event.result_count} clean source documents`,
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
          `Distilled ${event.evidence_count} evidence claims across ${event.source_count || 0} authoritative sources`,
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
            `Reflection: ${weak} facet${weak > 1 ? "s" : ""} require deeper evidence. Commencing iterative search...`,
            "progress"
          );
        } else {
          addActivity(
            "Reflection: All facets meet rigorous evidentiary threshold.",
            "success"
          );
        }
      }

      if (
        !event.sub_questions &&
        !event.query_count &&
        !event.result_count &&
        event.evidence_count === undefined &&
        !event.verdicts &&
        event.node !== "END"
      ) {
        addActivity(`Stage ${stage} executed successfully`, "info");
      }
    },
    [addActivity, updateStages]
  );

  const startResearch = useCallback(
    (targetQuery?: string) => {
      const q = (targetQuery || query).trim();
      if (!q || isResearching) return;

      if (targetQuery) {
        setQuery(targetQuery);
      }

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

      addActivity(`Initiating inquiry: "${q}"`, "progress");

      const cleanup = streamResearch(
        q,
        handleEvent,
        (err) => {
          setError(err);
          setIsResearching(false);
          addActivity(`Pipeline halt: ${err}`, "error");
        },
        () => {
          setIsResearching(false);
        }
      );

      cleanupRef.current = cleanup;
    },
    [query, isResearching, addActivity, handleEvent]
  );

  const handleCopyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anveshaka-dossier-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-20 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border pb-4 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Investigation Console
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Autonomous multi-round inquiry, iterative gap reflection, and evidence synthesis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-surface text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Browse Archive</span>
            </Link>
          </div>
        </div>

        {/* ── Research Input Command Bar ──────────────────── */}
        <div className="mb-6 print:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startResearch();
            }}
            className="relative flex items-center gap-2 rounded-xl border border-border bg-surface p-2 shadow-xs focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all"
          >
            <div className="flex items-center justify-center pl-3 text-text-muted">
              <Search className="h-5 w-5" />
            </div>

            <input
              type="text"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isResearching}
              placeholder="Enter complex research objective, comparative analysis, or empirical inquiry..."
              className="flex-1 bg-transparent px-2 py-2 text-sm sm:text-base text-text-primary placeholder:text-text-muted outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={isResearching || !query.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs sm:text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Investigating...</span>
                </>
              ) : (
                <>
                  <span>Initiate Investigation</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick topic tags when idle */}
          {!isResearching && !report && activityLog.length === 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-text-muted">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Inquiry Sparks:</span>
              {CURATED_RESEARCH_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => startResearch(topic)}
                  className="px-2.5 py-1 rounded-md border border-border-subtle bg-surface/60 hover:bg-surface-elevated hover:border-accent/40 text-text-secondary hover:text-text-primary text-left text-xs transition-colors"
                >
                  {topic.length > 55 ? `${topic.slice(0, 52)}...` : topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Pipeline Tracker ────────────────────────────── */}
        <div className="mb-6 rounded-xl border border-border bg-surface/50 p-2 sm:p-4 print:hidden">
          <PipelineTracker stages={stages} />
        </div>

        {/* ── Telemetry Ribbon (when active or complete) ──── */}
        {(isResearching || stats.queryCount > 0) && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 p-3 rounded-xl border border-border bg-surface text-center font-mono text-xs print:hidden">
            <div className="p-2 rounded-lg bg-surface-secondary">
              <div className="text-text-muted text-[10px] uppercase">Iteration Round</div>
              <div className="text-sm font-semibold text-text-primary mt-0.5">
                {stats.roundNum} / {stats.maxRounds}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface-secondary">
              <div className="text-text-muted text-[10px] uppercase">Formulated Queries</div>
              <div className="text-sm font-semibold text-text-primary mt-0.5">
                {stats.queryCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface-secondary">
              <div className="text-text-muted text-[10px] uppercase">Evidence Claims</div>
              <div className="text-sm font-semibold text-accent mt-0.5">
                {stats.evidenceCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface-secondary">
              <div className="text-text-muted text-[10px] uppercase">Unique Sources</div>
              <div className="text-sm font-semibold text-text-primary mt-0.5">
                {stats.sourceCount}
              </div>
            </div>
          </div>
        )}

        {/* ── Error Banner ────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-error/30 bg-error-subtle p-4 text-xs sm:text-sm text-error print:hidden">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Investigation Error:</span> {error}
            </div>
          </div>
        )}

        {/* ── Live Activity & Facets Split Panel ──────────── */}
        {(isResearching || activityLog.length > 0) && !report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:hidden">
            <LiveActivity entries={activityLog} />
            <ResearchFacets
              subQuestions={subQuestions}
              verdicts={verdicts}
              activeStage={currentStage}
            />
          </div>
        )}

        {/* ── Report Output Section (When Complete) ───────── */}
        {report && (
          <div className="space-y-6">
            {/* Action Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface print:hidden">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-semibold text-text-primary">Dossier Ready</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{stats.evidenceCount} claims verified</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-secondary text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy Markdown"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-secondary text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .md</span>
                </button>

                <ExportPdfButton title={query || "Anveshaka Research Dossier"} />

                <button
                  type="button"
                  onClick={() => {
                    setReport(null);
                    setActivityLog([]);
                    setSubQuestions([]);
                    setQuery("");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                  title="Reset and start new investigation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>New Query</span>
                </button>
              </div>
            </div>

            {/* Dossier Document Container */}
            <article className="rounded-xl border border-border bg-surface-secondary p-6 sm:p-10 shadow-xs">
              {/* Publication Print Header Banner */}
              <div className="hidden print:block print-dossier-banner">
                <div className="banner-top">
                  <strong>ANVESHAKA · RESEARCH INTELLIGENCE DOSSIER</strong>
                  <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <h1>{query || "Autonomous Investigation Briefing"}</h1>
                <div className="banner-meta">
                  <div><span>Queries</span>{stats.queryCount} executed</div>
                  <div><span>Claims</span>{stats.evidenceCount} verified</div>
                  <div><span>Sources</span>{stats.sourceCount} unique</div>
                  <div><span>Rounds</span>{stats.roundNum} completed</div>
                </div>
              </div>

              {/* Rendered Publication Markdown */}
              <div className="report-content max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report}
                </ReactMarkdown>
              </div>
            </article>
          </div>
        )}

        {/* ── Empty State ─────────────────────────────────── */}
        {!isResearching && activityLog.length === 0 && !report && (
          <div className="py-16 text-center border border-dashed border-border rounded-xl bg-surface/30 p-8 max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-xl border border-border bg-surface flex items-center justify-center mx-auto mb-4 text-text-muted">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Awaiting Research Objective
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto mb-6">
              Enter any inquiry above or select a spark topic. Anveshaka will formulate search queries, extract and evaluate evidence, reflect on factual voids, and synthesize an exhaustive cited dossier.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <Navbar />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="h-7 w-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        </div>
      }
    >
      <ResearchConsole />
    </Suspense>
  );
}

