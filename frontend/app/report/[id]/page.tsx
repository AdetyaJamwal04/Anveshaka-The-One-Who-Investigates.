"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getReport } from "@/lib/api";
import type { ReportDetail } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Copy, Download, Share2, ChevronRight, Clock, BookOpen, Check, ArrowLeft } from "lucide-react";
import ExportPdfButton from "@/components/ExportPdfButton";
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
  const [shared, setShared] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await getReport(decodeURIComponent(filename));
        setReport(data);
      } catch {
        setError("Dossier could not be located in archive.");
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

  // Compute publication metrics
  const metadata = useMemo(() => {
    if (!report?.content) return null;
    const words = report.content.split(/\s+/).filter(Boolean).length;
    const citations = (report.content.match(/\[\d+\]/g) || []).length;
    const uniqueCitations = new Set(
      (report.content.match(/\[\d+\]/g) || []).map((c) => c)
    ).size;
    const readingTimeMinutes = Math.max(1, Math.round(words / 220));
    return { words, citations, uniqueCitations, readingTimeMinutes };
  }, [report]);

  const cleanTitle = useMemo(() => {
    if (!report) return "Research Dossier";
    return report.filename
      .replace(/\.md$/, "")
      .replace(/_\d{8}_\d{6}$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }, [report]);

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = report.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: cleanTitle,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Ignore user abort
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-mono text-text-muted">Loading research dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md rounded-xl border border-border bg-surface p-8 shadow-xs">
            <FileText className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
            <h2 className="text-base font-semibold text-text-primary mb-1">
              Dossier Not Found
            </h2>
            <p className="text-xs text-text-secondary mb-6">{error || "The specified report could not be found."}</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/reports"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Archive</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-6 font-mono print:hidden">
          <Link href="/reports" className="hover:text-text-primary transition-colors flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Archive</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-border" />
          <span className="text-text-secondary truncate max-w-sm font-sans font-medium">
            {cleanTitle}
          </span>
        </nav>

        <div className="flex flex-col xl:flex-row gap-10 items-start">
          {/* ── Main Publication Article ────────────────────── */}
          <article className="flex-1 min-w-0 max-w-3xl w-full">
            {/* Dossier Header (Web view) */}
            <div className="border-b border-border pb-6 mb-8 print:hidden">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono text-accent uppercase tracking-wider">
                <span>Autonomous Intelligence Dossier</span>
                <span>·</span>
                <span>Verified Evidence</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight leading-tight mb-4">
                {cleanTitle}
              </h1>

              {/* Technical Telemetry Metadata */}
              {metadata && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-text-muted pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-text-muted" />
                    <span>{metadata.readingTimeMinutes} min read</span>
                  </span>
                  <span>·</span>
                  <span>{metadata.words.toLocaleString()} words</span>
                  <span>·</span>
                  <span className="text-accent font-semibold">{metadata.uniqueCitations} verified citations</span>
                  <span>·</span>
                  <span>{(report.content.length / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>

            {/* Document Utility Toolbar (Web view) */}
            <div className="flex items-center gap-2 mb-8 flex-wrap print:hidden">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy Markdown"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .md</span>
              </button>

              <ExportPdfButton title={cleanTitle} />

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              >
                {shared ? <Check className="h-3.5 w-3.5 text-success" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{shared ? "Link Copied" : "Share"}</span>
              </button>
            </div>

            {/* Publication Print Header Banner */}
            <div className="hidden print:block print-dossier-banner">
              <div className="banner-top">
                <strong>ANVESHAKA · RESEARCH INTELLIGENCE DOSSIER</strong>
                <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <h1>{cleanTitle}</h1>
              {metadata && (
                <div className="banner-meta">
                  <div><span>Reading Time</span>{metadata.readingTimeMinutes} min ({metadata.words.toLocaleString()} words)</div>
                  <div><span>Citations</span>{metadata.uniqueCitations} verified references</div>
                  <div><span>Provenance</span>Multi-Round Synthesis</div>
                  <div><span>Classification</span>Exhaustive Intelligence Dossier</div>
                </div>
              )}
            </div>

            {/* Rendered Publication Content */}
            <div className="report-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {report.content}
              </ReactMarkdown>
            </div>
          </article>

          {/* ── Sticky Table of Contents ────────────────────── */}
          {headings.length > 0 && (
            <aside className="hidden xl:block w-64 shrink-0 sticky top-24 print:hidden">
              <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
                <h4 className="text-xs font-mono uppercase tracking-wider text-text-primary font-semibold mb-3">
                  Outline
                </h4>
                <nav className="flex flex-col gap-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                  {headings.map((h, i) => (
                    <a
                      key={`${h.id}-${i}`}
                      href={`#${h.id}`}
                      onClick={() => setActiveSection(h.id)}
                      className={`text-xs leading-snug py-1 px-2 rounded-md transition-colors ${
                        activeSection === h.id
                          ? "bg-accent-subtle text-accent font-medium"
                          : "text-text-muted hover:text-text-primary hover:bg-surface-secondary"
                      } ${h.level === 3 ? "ml-3 text-[11px]" : ""}`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
