"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getReport } from "@/lib/api";
import type { ReportDetail } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Copy, Download, Share2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface HeadingEntry {
  id: string;
  text: string;
  level: number;
}

export default function ReportViewerPage() {
  const params = useParams();
  const filename = params.id as string;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await getReport(decodeURIComponent(filename));
        setReport(data);
      } catch {
        setError("Report not found.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [filename]);

  // Extract headings for table of contents
  const headings = useMemo<HeadingEntry[]>(() => {
    if (!report?.content) return [];
    const matches = report.content.matchAll(/^(#{1,3})\s+(.+)$/gm);
    return Array.from(matches).map((m) => ({
      id: m[2]
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-"),
      text: m[2],
      level: m[1].length,
    }));
  }, [report]);

  // Compute metadata
  const metadata = useMemo(() => {
    if (!report?.content) return null;
    const words = report.content.split(/\s+/).length;
    const citations = (report.content.match(/\[\d+\]/g) || []).length;
    const uniqueCitations = new Set(
      (report.content.match(/\[\d+\]/g) || []).map((c) => c)
    ).size;
    return { words, citations, uniqueCitations };
  }, [report]);

  const handleCopy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <span className="text-sm text-zinc-500">Loading report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-zinc-300 mb-2">
              Report Not Found
            </h2>
            <p className="text-sm text-zinc-500 mb-6">{error}</p>
            <Link
              href="/research"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              ← Back to Research
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-zinc-500 mb-6">
            <Link
              href="/research"
              className="hover:text-zinc-300 transition-colors"
            >
              Research
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-zinc-400 truncate max-w-xs">
              {report.filename.replace(".md", "").replace(/_/g, " ")}
            </span>
          </nav>

          <div className="flex gap-8">
            {/* ── Main Report ──────────────────────────────── */}
            <article className="flex-1 min-w-0 max-w-3xl">
              {/* Title derived from first heading or filename */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {report.filename
                  .replace(".md", "")
                  .replace(/_\d{8}_\d{6}$/, "")
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </h1>

              {/* Metadata bar */}
              {metadata && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mb-6">
                  <span>{metadata.words.toLocaleString()} words</span>
                  <span className="text-zinc-700">·</span>
                  <span>{metadata.uniqueCitations} citations</span>
                  <span className="text-zinc-700">·</span>
                  <span>
                    {(report.content.length / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mb-8">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>

              {/* Rendered markdown */}
              <div className="report-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.content}
                </ReactMarkdown>
              </div>
            </article>

            {/* ── Table of Contents ────────────────────────── */}
            {headings.length > 0 && (
              <aside className="hidden xl:block w-56 shrink-0">
                <div className="sticky top-28">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Table of Contents
                  </h4>
                  <nav className="flex flex-col gap-0.5">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`text-xs leading-relaxed transition-colors py-0.5 border-l-2 ${
                          activeSection === h.id
                            ? "border-violet-500 text-violet-400 pl-3"
                            : "border-transparent text-zinc-500 hover:text-zinc-300 pl-3"
                        } ${h.level === 3 ? "pl-6" : ""}`}
                        onClick={() => setActiveSection(h.id)}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
