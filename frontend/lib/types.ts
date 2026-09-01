/**
 * Anveshaka Frontend — TypeScript type definitions.
 * Maps to the FastAPI backend schemas and SSE event payloads.
 */

// ── Research Pipeline Types ────────────────────────────────────

export interface SubQuestion {
  id: string;
  text: string;
  priority?: number;
  parent_intent?: string;
}

export interface Verdict {
  sub_question_id: string;
  verdict: "sufficient" | "needs_more";
}

export type PipelineStage =
  | "Synthesize"
  | "Decompose"
  | "Search"
  | "Extract"
  | "Reflect"
  | "Report"
  | "Complete";

export type StageStatus = "pending" | "active" | "completed";

export interface StageState {
  name: PipelineStage;
  status: StageStatus;
}

// ── SSE Event Payloads ─────────────────────────────────────────

export interface SSEEvent {
  node: string;
  stage: PipelineStage;
  status: string;

  // Optional enriched data
  sub_questions?: SubQuestion[];
  query_count?: number;
  result_count?: number;
  evidence_count?: number;
  source_count?: number;
  round_num?: number;
  verdicts?: Verdict[];
  report?: string;
  error?: string;
}

// ── Research State (Frontend) ──────────────────────────────────

export type ResearchStatus = "idle" | "researching" | "completed" | "error";

export interface ResearchState {
  status: ResearchStatus;
  query: string;
  stages: StageState[];
  subQuestions: SubQuestion[];
  verdicts: Verdict[];
  activityLog: ActivityEntry[];
  stats: ResearchStats;
  report: string | null;
  error: string | null;
}

export interface ActivityEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "success" | "progress" | "info" | "error";
}

export interface ResearchStats {
  roundNum: number;
  maxRounds: number;
  queryCount: number;
  evidenceCount: number;
  sourceCount: number;
}

// ── Report Types ───────────────────────────────────────────────

export interface ReportSummary {
  filename: string;
  path: string;
  size_bytes: number;
  modified: string;
}

export interface ReportDetail {
  filename: string;
  content: string;
}
