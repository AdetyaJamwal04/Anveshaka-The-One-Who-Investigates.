/**
 * Anveshaka Frontend — API client.
 * Handles REST calls and SSE streaming to the FastAPI backend.
 */

import type { SSEEvent, ReportSummary, ReportDetail } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── REST Endpoints ─────────────────────────────────────────────

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}

export async function listReports(): Promise<ReportSummary[]> {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function getReport(filename: string): Promise<ReportDetail> {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error("Report not found");
  return res.json();
}

// ── SSE Streaming ──────────────────────────────────────────────

export function streamResearch(
  query: string,
  onEvent: (event: SSEEvent) => void,
  onError: (error: string) => void,
  onComplete: () => void
): () => void {
  const url = `${API_BASE}/research/stream?query=${encodeURIComponent(query)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data: SSEEvent = JSON.parse(event.data);

      if (data.error) {
        onError(data.error);
        eventSource.close();
        return;
      }

      onEvent(data);

      if (data.node === "END") {
        onComplete();
        eventSource.close();
      }
    } catch (err) {
      console.error("Failed to parse SSE event:", err);
    }
  };

  eventSource.onerror = () => {
    onError("Connection to research server lost. Please try again.");
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}
