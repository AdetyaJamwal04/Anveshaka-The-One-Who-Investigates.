"use client";

import { useState, useCallback } from "react";
import { FileText, Loader2 } from "lucide-react";

interface ExportPdfButtonProps {
  title?: string;
  className?: string;
}

/**
 * Generates a professional PDF from the `.report-content` element
 * using html2pdf.js instead of window.print().
 *
 * We build a self-contained HTML document with inline styles so the
 * generated PDF looks like a polished executive report regardless of
 * the user's browser print settings or theme mode.
 */
export default function ExportPdfButton({
  title = "Anveshaka Research Report",
  className = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer",
}: ExportPdfButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);

    try {
      // Dynamic import — keeps bundle size small until user actually exports
      const html2pdf = (await import("html2pdf.js")).default;

      // Find the report content container
      const reportEl = document.querySelector(".report-content");
      if (!reportEl) {
        alert("No report content found to export.");
        setExporting(false);
        return;
      }

      // Build a clean, self-styled clone for PDF rendering
      const wrapper = document.createElement("div");

      // ─── Executive Header ───
      const header = document.createElement("div");
      header.innerHTML = `
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-family: 'Segoe UI', system-ui, sans-serif; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
            <strong style="color: #0f172a; font-weight: 700;">ANVESHAKA · RESEARCH INTELLIGENCE DOSSIER</strong>
            <span>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; margin: 0 0 6px 0; font-family: Georgia, 'Times New Roman', serif;">${escapeHtml(title)}</h1>
          <div style="display: flex; gap: 24px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 8px; font-family: 'Segoe UI', system-ui, sans-serif; color: #475569;">
            <div><span style="display: block; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Provenance</span>Multi-Round AI Synthesis</div>
            <div><span style="display: block; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Classification</span>Exhaustive Intelligence Dossier</div>
            <div><span style="display: block; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Generated</span>${new Date().toISOString().split("T")[0]}</div>
          </div>
        </div>
      `;
      wrapper.appendChild(header);

      // ─── Report Body Clone ───
      const contentClone = reportEl.cloneNode(true) as HTMLElement;

      // Apply inline print-friendly styles to the clone
      applyPrintStyles(contentClone);

      wrapper.appendChild(contentClone);

      // Apply wrapper-level styles
      wrapper.style.cssText = `
        font-family: Georgia, 'Times New Roman', serif;
        color: #111827;
        font-size: 11px;
        line-height: 1.7;
        background: #ffffff;
        padding: 0;
      `;

      // Generate PDF
      const sanitizedTitle = title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 60);

      await html2pdf()
        .set({
          margin: [12, 14, 12, 14], // mm: top, right, bottom, left
          filename: `Anveshaka_${sanitizedTitle}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            backgroundColor: "#ffffff",
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
          },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(wrapper)
        .save();
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [exporting, title]);

  return (
    <button
      onClick={handleExport}
      type="button"
      disabled={exporting}
      className={className}
      title="Export publication PDF"
    >
      {exporting ? (
        <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-accent" />
      )}
      <span>{exporting ? "Generating…" : "Export PDF"}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper: apply inline print-safe styles to cloned DOM
// ═══════════════════════════════════════════════════════════════
function applyPrintStyles(el: HTMLElement) {
  // Force all backgrounds to white and text to dark
  el.style.backgroundColor = "#ffffff";
  el.style.color = "#111827";

  // Style headings
  el.querySelectorAll("h1").forEach((h) => {
    h.style.cssText = `font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; margin: 24px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #0f172a; line-height: 1.3;`;
  });

  el.querySelectorAll("h2").forEach((h) => {
    h.style.cssText = `font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 20px 0 8px; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1; line-height: 1.3;`;
  });

  el.querySelectorAll("h3").forEach((h) => {
    h.style.cssText = `font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; font-size: 13px; font-weight: 700; color: #1e293b; margin: 16px 0 6px; line-height: 1.3;`;
  });

  el.querySelectorAll("h4, h5, h6").forEach((h) => {
    (h as HTMLElement).style.cssText = `font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; font-size: 12px; font-weight: 700; color: #334155; margin: 12px 0 4px; line-height: 1.3;`;
  });

  // Paragraphs
  el.querySelectorAll("p").forEach((p) => {
    p.style.cssText = `color: #111827; margin-bottom: 10px; line-height: 1.7; font-size: 11px;`;
  });

  // Lists
  el.querySelectorAll("ul, ol").forEach((list) => {
    (list as HTMLElement).style.cssText = `color: #111827; margin: 6px 0 12px 18px; padding: 0; font-size: 11px;`;
  });

  el.querySelectorAll("li").forEach((li) => {
    li.style.cssText = `margin-bottom: 4px; line-height: 1.65; font-size: 11px;`;
  });

  // Bold
  el.querySelectorAll("strong").forEach((s) => {
    s.style.cssText = `font-weight: 700; color: #0f172a;`;
  });

  // Blockquotes
  el.querySelectorAll("blockquote").forEach((bq) => {
    (bq as HTMLElement).style.cssText = `border-left: 3px solid #1d4ed8; background-color: #f8fafc; color: #334155; padding: 8px 14px; margin: 12px 0; font-style: italic; font-size: 10.5px;`;
  });

  // Tables
  el.querySelectorAll("table").forEach((t) => {
    (t as HTMLElement).style.cssText = `width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 10px; font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;`;
  });

  el.querySelectorAll("th").forEach((th) => {
    (th as HTMLElement).style.cssText = `background-color: #f1f5f9; color: #0f172a; font-weight: 700; border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; font-size: 10px;`;
  });

  el.querySelectorAll("td").forEach((td) => {
    (td as HTMLElement).style.cssText = `color: #1e293b; border: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top; font-size: 10px;`;
  });

  // Code blocks
  el.querySelectorAll("pre").forEach((pre) => {
    (pre as HTMLElement).style.cssText = `background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px 12px; font-size: 9px; font-family: 'Cascadia Code', 'Fira Code', monospace; margin: 12px 0; overflow-x: auto; white-space: pre-wrap; word-break: break-all;`;
  });

  el.querySelectorAll("code").forEach((code) => {
    (code as HTMLElement).style.cssText = `font-family: 'Cascadia Code', 'Fira Code', monospace; background-color: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; font-size: 9.5px; padding: 1px 4px; border-radius: 3px;`;
  });

  // Links
  el.querySelectorAll("a").forEach((a) => {
    a.style.cssText = `color: #1d4ed8; text-decoration: underline; word-break: break-all;`;
  });

  // Horizontal rules
  el.querySelectorAll("hr").forEach((hr) => {
    (hr as HTMLElement).style.cssText = `border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;`;
  });

  // Remove any dark-mode specific classes
  el.classList.remove("dark");
  el.querySelectorAll("[class*='dark:']").forEach((darkEl) => {
    // Just ensure background is white
    (darkEl as HTMLElement).style.backgroundColor = "#ffffff";
  });
}

// ═══════════════════════════════════════════════════════════════
// Helper: escape HTML entities in user-provided strings
// ═══════════════════════════════════════════════════════════════
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
