"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { listReports } from "@/lib/api";
import type { ReportSummary } from "@/lib/types";
import {
  Compass,
  ArrowRight,
  Search,
  Cpu,
  RefreshCw,
  FileCheck2,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [inquiry, setInquiry] = useState("");
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const data = await listReports();
        setRecentReports((data || []).slice(0, 3));
      } catch {
        // Silently handle if offline
      }
    }
    loadRecent();
  }, []);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inquiry.trim()) {
      router.push(`/research?q=${encodeURIComponent(inquiry.trim())}`);
    } else {
      router.push("/research");
    }
  };

  const PIPELINE_NODES = [
    {
      id: "01",
      name: "Query Synthesizer",
      stage: "Synthesize",
      role: "Classifies research intent (comparative, causal, trend) and architecture.",
    },
    {
      id: "02",
      name: "Sub-question Generator",
      stage: "Decompose",
      role: "Decomposes complex objectives into independent investigative facets.",
    },
    {
      id: "03",
      name: "Search Query Generator",
      stage: "Formulate",
      role: "Engineers diverse, high-precision technical queries per sub-question.",
    },
    {
      id: "04",
      name: "Search Executor",
      stage: "Execute",
      role: "Runs concurrent web search via Tavily and filters out low-signal artifacts.",
    },
    {
      id: "05",
      name: "Content Processor",
      stage: "Extract",
      role: "Distills dense, factual evidence claims attributed strictly to source URLs.",
    },
    {
      id: "06",
      name: "Knowledge Store",
      stage: "Accumulate",
      role: "Maintains structured in-memory evidence state across multiple rounds.",
    },
    {
      id: "07",
      name: "Reflection Auditor",
      stage: "Reflect",
      role: "Assesses factual voids, evaluates source diversity, and pivots queries.",
    },
    {
      id: "08",
      name: "Report Synthesizer",
      stage: "Synthesize",
      role: "Synthesizes multi-paragraph analysis with exhaustive inline citations.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Editorial Hero ───────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 max-w-5xl mx-auto w-full text-center">
        {/* Sanskrit Designation Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono text-text-secondary mb-6 shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span>अन्वेषक · Autonomous Research Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-text-primary leading-[1.15] max-w-4xl mx-auto">
          Autonomous Investigation.
          <br />
          <span className="text-accent">Verified Evidence.</span> Cited Dossiers.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Anveshaka operates an iterative multi-round LangGraph state machine that decomposes inquiries, verifies empirical evidence across sources, audits factual voids, and synthesizes exhaustive, cited research reports.
        </p>

        {/* Direct Investigation Launch Bar */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleLaunch}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2 shadow-xs focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all"
          >
            <div className="pl-3 text-text-muted">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={inquiry}
              onChange={(e) => setInquiry(e.target.value)}
              placeholder="Enter a research topic, comparative matrix, or empirical question..."
              className="flex-1 bg-transparent px-2 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shrink-0 shadow-xs"
            >
              <span>Investigate</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Quick topics */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-xs text-text-muted">
            <span className="font-mono text-[11px]">Inquiries:</span>
            {[
              "GLP-1 vs SGLT2 inhibitors clinical efficacy",
              "Algorithmic trading and market liquidity risks",
              "Sodium-ion vs LFP batteries for grid storage",
            ].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setInquiry(t);
                  router.push(`/research?q=${encodeURIComponent(t)}`);
                }}
                className="hover:text-text-primary hover:underline underline-offset-4 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture Pipeline Section ────────────────── */}
      <section id="pipeline" className="px-4 sm:px-6 lg:px-8 py-16 border-t border-border bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider text-accent mb-2">
              <Cpu className="h-3.5 w-3.5" />
              <span>State Graph Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              The 8-Stage Research Lifecycle
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Rather than single-pass summarization, Anveshaka executes an autonomous loop with verification checkpoints and reflection audits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIPELINE_NODES.map((node) => (
              <div
                key={node.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-semibold text-accent px-2 py-0.5 rounded-md bg-accent-subtle border border-accent/20">
                      Node {node.id}
                    </span>
                    <span className="text-[11px] font-mono uppercase text-text-muted">
                      {node.stage}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-text-primary mb-1.5">
                    {node.name}
                  </h3>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {node.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Empirical Pillars Section ────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg border border-border bg-surface flex items-center justify-center text-accent">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Reflective Iteration
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                A dedicated scientific auditor reviews collected evidence against each sub-facet. If claims are superficial or lack source diversity, the engine reformulates new queries and searches again.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg border border-border bg-surface flex items-center justify-center text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Anti-Bias Neutrality
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Commercial marketing claims, promotional rhetoric, and sensationalism are scrubbed during content processing. Contested or qualitative claims are explicitly attributed to their origin.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg border border-border bg-surface flex items-center justify-center text-accent">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Verifiable Citations
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every assertion in the generated dossier is tied to an indexed reference `[N]` mapping to actual source URLs and titles, enabling rapid independent verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent Archive Section (If reports exist) ───── */}
      {recentReports.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-border bg-surface/20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                  Recent Synthesized Dossiers
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Archived research reports from the local repository.
                </p>
              </div>

              <Link
                href="/reports"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline underline-offset-4"
              >
                <span>View All ({recentReports.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentReports.map((r) => {
                const title = r.filename
                  .replace(/\.md$/, "")
                  .replace(/_\d{8}_\d{6}$/, "")
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <Link
                    key={r.filename}
                    href={`/report/${encodeURIComponent(r.filename)}`}
                    className="flex flex-col justify-between p-4 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-elevated transition-colors shadow-xs"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-text-muted block mb-1">
                        {(r.size_bytes / 1024).toFixed(1)} KB
                      </span>
                      <h4 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                        {title}
                      </h4>
                    </div>
                    <div className="mt-4 pt-2 border-t border-border flex items-center justify-between text-xs text-accent font-medium">
                      <span>Read Dossier</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Technical Footer ─────────────────────────────── */}
      <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-10 mt-auto bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Compass className="h-4 w-4 text-accent" />
            <span className="font-semibold text-text-primary">Anveshaka</span>
            <span className="text-text-muted">·</span>
            <span className="font-mono text-text-muted">अन्वेषक</span>
            <span className="text-text-muted">·</span>
            <span>The one who investigates</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-text-muted">
            <Link href="/research" className="hover:text-text-primary transition-colors">
              Investigate
            </Link>
            <Link href="/reports" className="hover:text-text-primary transition-colors">
              Archive
            </Link>
            <a
              href="https://github.com/AdetyaJamwal04/Anveshaka-The-One-Who-Investigates."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
