import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Search, FileText, RefreshCw, Shield, Zap, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="aurora-bg grid-pattern relative flex flex-col items-center justify-center px-6 pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-sm text-zinc-400 backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Powered by LangGraph + Gemini
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Research at the
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              speed of thought
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-delay-1 mt-6 max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed">
            Autonomous AI agent that decomposes complex queries, searches the web
            across multiple rounds, extracts evidence, and synthesizes
            comprehensive cited reports.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-delay-2 mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/research"
              className="group relative rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-2xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98]"
            >
              <span className="relative z-10">Start Researching →</span>
            </Link>
            <a
              href="https://github.com/AdetyaJamwal04/Anveshaka-The-One-Who-Investigates."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-3.5 text-base font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-zinc-700 hover:text-white hover:bg-zinc-800/50"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Floating Dashboard Preview */}
        <div className="animate-fade-in-delay-3 relative z-10 mt-16 md:mt-24 w-full max-w-5xl mx-auto">
          <div className="animate-float rounded-xl border border-zinc-800/60 bg-zinc-950/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-sm">
            {/* Mock dashboard header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 mx-4 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center px-3">
                <Search className="h-3.5 w-3.5 text-zinc-600 mr-2" />
                <span className="text-sm text-zinc-500">
                  Compare the clinical efficacy of GLP-1 vs SGLT2 inhibitors...
                </span>
              </div>
            </div>

            {/* Mock pipeline */}
            <div className="flex items-center justify-between px-8 py-4">
              {["Synthesize", "Decompose", "Search", "Extract", "Reflect", "Report"].map(
                (stage, i) => (
                  <div key={stage} className="flex items-center gap-0 flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                          i < 3
                            ? "bg-emerald-500/10 border border-emerald-500 text-emerald-400"
                            : i === 3
                            ? "bg-violet-500/10 border border-violet-500 text-violet-400 shadow-lg shadow-violet-500/20"
                            : "bg-zinc-900 border border-zinc-700 text-zinc-600"
                        }`}
                      >
                        {i < 3 ? "✓" : i === 3 ? "●" : "○"}
                      </div>
                      <span className={`text-[10px] ${i < 3 ? "text-emerald-400" : i === 3 ? "text-violet-400" : "text-zinc-600"}`}>
                        {stage}
                      </span>
                    </div>
                    {i < 5 && (
                      <div className="flex-1 mx-2 mt-[-1rem]">
                        <div className={`h-px ${i < 3 ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Mock stats */}
            <div className="flex items-center justify-center gap-6 py-2 text-xs text-zinc-500">
              <span>Round 2 of 3</span>
              <span>·</span>
              <span>28 queries executed</span>
              <span>·</span>
              <span>87 evidence claims</span>
              <span>·</span>
              <span>19 unique sources</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────── */}
      <section id="features" className="relative px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How Anveshaka Works
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              An 8-stage autonomous pipeline that thinks like a researcher — 
              decomposing, searching, reflecting, and iterating until the evidence is comprehensive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Multi-Round Search",
                description:
                  "Up to 3 rounds of iterative web search, each round targeting gaps identified by the reflection agent.",
                gradient: "from-violet-500 to-purple-600",
              },
              {
                icon: FileText,
                title: "Evidence Extraction",
                description:
                  "LLM-powered extraction of factual claims from search results, each traceable to its source URL.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: RefreshCw,
                title: "Reflective Iteration",
                description:
                  "Evaluates evidence depth, source diversity, and specificity — loops back if gaps are found.",
                gradient: "from-emerald-500 to-teal-500",
              },
              {
                icon: Shield,
                title: "Anti-Bias Framework",
                description:
                  "Built-in neutrality guardrails ensure balanced, objective reports free from inherent bias.",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                icon: Zap,
                title: "Concurrent Processing",
                description:
                  "Semaphore-controlled parallel LLM calls with async execution for maximum throughput.",
                gradient: "from-rose-500 to-pink-500",
              },
              {
                icon: BarChart3,
                title: "Cited Reports",
                description:
                  "Structured markdown reports with numbered inline citations and a full references section.",
                gradient: "from-indigo-500 to-violet-500",
              },
            ].map(({ icon: Icon, title, description, gradient }) => (
              <div
                key={title}
                className="group rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-6 transition-all duration-300 hover:border-zinc-700/50 hover:bg-zinc-900/50"
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline Diagram Section ──────────────────────── */}
      <section className="px-6 py-16 md:py-24 border-t border-zinc-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            The Research Pipeline
          </h2>
          <p className="text-zinc-400 mb-12 max-w-xl mx-auto">
            8 specialized agents working in concert, orchestrated by LangGraph
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              "Query Synthesizer",
              "Sub-question Generator",
              "Search Query Generator",
              "Search Executor",
              "Evidence Extractor",
              "Knowledge Store",
              "Reflection Agent",
              "Report Synthesizer",
            ].map((agent, i) => (
              <div key={agent} className="flex items-center gap-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-300">
                  <span className="mr-2 text-xs text-violet-400 font-mono">
                    {i + 1}
                  </span>
                  {agent}
                </div>
                {i < 7 && (
                  <span className="text-zinc-700 hidden sm:inline">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 px-6 py-12">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-500">
              <Search className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-400">
              Anveshaka
            </span>
            <span className="text-xs text-zinc-600 ml-1">अन्वेषक</span>
          </div>
          <p className="text-sm text-zinc-600">
            Built by{" "}
            <a
              href="https://github.com/AdetyaJamwal04"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              AdetyaJamwal04
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
