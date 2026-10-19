"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { listReports } from "@/lib/api";
import type { ReportSummary } from "@/lib/types";
import Link from "next/link";
import { FileText, Search, ArrowUpRight, Clock, HardDrive, Download, AlertCircle, RefreshCw } from "lucide-react";

export default function ReportsArchivePage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    listReports()
      .then((data) => {
        if (active) {
          setReports(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to connect to the report archive. Ensure the backend engine is running.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReports();
      setReports(data || []);
    } catch {
      setError("Unable to connect to the report archive. Ensure the backend engine is running.");
    } finally {
      setLoading(false);
    }
  };

  const formatTitle = (filename: string) => {
    return filename
      .replace(/\.md$/, "")
      .replace(/_\d{8}_\d{6}$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (timestampStr: string) => {
    try {
      const ts = parseFloat(timestampStr) * 1000;
      if (isNaN(ts)) return "Archived";
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Archived";
    }
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const query = searchQuery.toLowerCase();
    return reports.filter((r) =>
      r.filename.toLowerCase().includes(query) ||
      formatTitle(r.filename).toLowerCase().includes(query)
    );
  }, [reports, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-10 pb-20 max-w-7xl mx-auto w-full">
        {/* Editorial Header */}
        <div className="mb-10 pb-6 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-widest text-accent">
                <span>Dossier Archive</span>
                <span>/</span>
                <span>Intelligence Records</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
                Research Dossiers
              </h1>
              <p className="mt-2 text-base text-text-secondary max-w-2xl">
                Permanent, fully-cited research reports synthesized by Anveshaka&apos;s autonomous multi-round pipeline.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                title="Refresh report list"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/research"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-xs"
              >
                <span>New Investigation</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by inquiry topic or keyword..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="h-7 w-7 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
            <span className="text-sm font-mono text-text-muted">Accessing dossier archive...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-error/30 bg-error-subtle p-6 text-center max-w-xl mx-auto">
            <AlertCircle className="h-8 w-8 text-error mx-auto mb-3" />
            <h3 className="text-base font-semibold text-text-primary mb-1">Archive Connection Unavailable</h3>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-lg bg-surface border border-border text-xs font-medium text-text-primary hover:bg-surface-secondary"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center rounded-xl border border-border-subtle bg-surface/50 p-8 max-w-xl mx-auto">
            <FileText className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold text-text-primary mb-1">
              {searchQuery ? "No matching dossiers found" : "Archive is currently empty"}
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
              {searchQuery
                ? `No reports matching "${searchQuery}". Try a different search term.`
                : "No research reports have been saved yet. Launch an autonomous investigation to synthesize your first dossier."}
            </p>
            {!searchQuery && (
              <Link
                href="/research"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
              >
                <span>Launch First Research Run</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const title = formatTitle(report.filename);
              const dateStr = formatDate(report.modified);
              const kbSize = (report.size_bytes / 1024).toFixed(1);

              return (
                <div
                  key={report.filename}
                  className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-5 hover:border-accent/60 hover:bg-surface-elevated transition-all duration-200 shadow-xs"
                >
                  <div>
                    {/* Metadata Header */}
                    <div className="flex items-center justify-between gap-2 mb-3 text-xs text-text-muted font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {kbSize} KB
                      </span>
                    </div>

                    {/* Report Title */}
                    <h2 className="text-base font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-2">
                      {report.query || title}
                    </h2>

                    {/* Rich Metadata Pills */}
                    {(report.sources_count !== undefined && report.sources_count > 0) ? (
                      <div className="flex items-center gap-2 mb-3 text-[11px] font-mono text-text-muted">
                        <span className="px-1.5 py-0.5 rounded-sm bg-surface-secondary border border-border">
                          {report.sources_count} sources
                        </span>
                        {report.claims_count !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-surface-secondary border border-border">
                            {report.claims_count} claims
                          </span>
                        )}
                        {report.read_time_minutes !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-surface-secondary border border-border">
                            {report.read_time_minutes}m read
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-text-muted truncate mb-4">
                        {report.filename}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Link
                      href={`/report/${encodeURIComponent(report.filename)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline underline-offset-4"
                    >
                      <span>Read Dossier</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>

                    <a
                      href={`/api/reports/${encodeURIComponent(report.filename)}`}
                      download={report.filename}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors p-1"
                      title="Download raw markdown"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>MD</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
