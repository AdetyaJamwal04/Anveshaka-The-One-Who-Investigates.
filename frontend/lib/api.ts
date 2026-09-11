/**
 * Anveshaka Frontend - API client.
 * Handles REST calls and SSE streaming to the FastAPI backend
 * via Next.js API route proxies (avoids cross-origin / firewall issues).
 */

import type { SSEEvent, ReportSummary, ReportDetail } from "./types";

const API_BASE = "/api";

// ── REST Endpoints ──────────────────────────────────────────

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}

export async function listReports(): Promise<ReportSummary[]> {
  const res = await fetch(`${API_BASE}/reports`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function getReport(filename: string): Promise<ReportDetail> {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(filename)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Report not found");
  return res.json();
}

// ── SSE Streaming ───────────────────────────────────────────

export function streamResearch(
  query: string,
  onEvent: (event: SSEEvent) => void,
  onError: (error: string) => void,
  onComplete: () => void
): () => void {
  const url = `${API_BASE}/research/stream?query=${encodeURIComponent(query)}`;
  const eventSource = new EventSource(url);
  let isDone = false;

  eventSource.onmessage = (event) => {
    try {
      const data: SSEEvent = JSON.parse(event.data);

      if (data.error) {
        isDone = true;
        onError(data.error);
        eventSource.close();
        return;
      }

      onEvent(data);

      if (data.node === "END") {
        isDone = true;
        onComplete();
        eventSource.close();
      }
    } catch (err) {
      console.error("Failed to parse SSE event:", err);
    }
  };

  eventSource.onerror = (e) => {
    // Suppress error if already completed or cleanly closed
    if (isDone || eventSource.readyState === EventSource.CLOSED) {
      return;
    }
    console.error("EventSource error:", e);
    isDone = true;
    onError("Connection to research server lost. Please check that the server is running and try again.");
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    isDone = true;
    eventSource.close();
  };
}
