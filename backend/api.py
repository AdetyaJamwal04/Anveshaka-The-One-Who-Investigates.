"""
FastAPI server exposing the Anveshaka pipeline as REST endpoints.

Provides a blocking POST endpoint for full research runs,
a Server-Sent Events (SSE) streaming endpoint for real-time progress,
and report management endpoints for the frontend.
"""

import os
import sys

# Ensure backend directory is in sys.path for local module resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import json
import asyncio
import glob
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from graph import app as research_graph

app = FastAPI(
    title="Anveshaka API",
    description="Autonomous Research Agent powered by LangGraph — अन्वेषक",
    version="1.0.0"
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # lock down to specific domains in production
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"[API] Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."}
    )


# ── Schemas ──────────────────────────────────────────────────────
class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=1000)

class ResearchResponse(BaseModel):
    query: str
    report: str

class ReportSummary(BaseModel):
    filename: str
    path: str
    size_bytes: int
    modified: str


# ── Health & Info Endpoints ─────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "Anveshaka API",
        "tagline": "अन्वेषक — Autonomous Research Agent",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }

@app.get("/health")
async def health():
    return {"status": "ok"}


# ── POST /research (blocking) ───────────────────────────────────
REQUEST_TIMEOUT = 180.0  # 3 minute hard limit

@app.post("/research", response_model=ResearchResponse)
async def run_research(request: ResearchRequest):
    print(f"\n[API] Received research request: '{request.query}'")

    try:
        final_state = await asyncio.wait_for(
            research_graph.ainvoke({"query": request.query}),
            timeout=REQUEST_TIMEOUT,
        )

        report_content = final_state.get("report_markdown")
        if not report_content:
            raise HTTPException(status_code=500, detail="Research completed but no report was generated.")

        return ResearchResponse(
            query=request.query,
            report=report_content
        )
    except asyncio.TimeoutError:
        print(f"[API] Research timed out after {REQUEST_TIMEOUT}s")
        raise HTTPException(status_code=504, detail="Research timed out. Try a simpler query.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] Research execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /research/stream (SSE) ──────────────────────────────────
NODE_DISPLAY_NAMES = {
    "synthesize": "Synthesize",
    "decompose": "Decompose",
    "generate_queries": "Search",
    "execute_searches": "Search",
    "extract_claims": "Extract",
    "reflect": "Reflect",
    "report": "Report",
}

async def research_event_generator(query: str):
    """
    Generator that yields Server-Sent Events (SSE) as LangGraph nodes finish.
    Sends enriched payloads including sub-questions, stats, and the final report.
    """
    try:
        async for event in research_graph.astream({"query": query}, stream_mode="updates"):
            for node_name, state_update in event.items():
                stage = NODE_DISPLAY_NAMES.get(node_name, node_name)

                payload = {
                    "node": node_name,
                    "stage": stage,
                    "status": "completed",
                }

                # Enrich with state data for the frontend
                if isinstance(state_update, dict):
                    # Sub-questions from decompose
                    if "sub_questions" in state_update:
                        sqs = state_update["sub_questions"]
                        payload["sub_questions"] = [
                            {
                                "id": sq.id,
                                "text": sq.text,
                                "priority": sq.priority,
                                "parent_intent": getattr(sq, "parent_intent", ""),
                            }
                            for sq in sqs
                        ]

                    # Search queries count
                    if "search_queries" in state_update:
                        payload["query_count"] = len(state_update["search_queries"])

                    # Search results count
                    if "search_results" in state_update:
                        payload["result_count"] = len(state_update["search_results"])

                    # Evidence store stats
                    if "store" in state_update:
                        store = state_update["store"]
                        payload["evidence_count"] = len(store.evidence)
                        payload["source_count"] = len(set(e.source_url for e in store.evidence))

                    # Round number
                    if "round_num" in state_update:
                        payload["round_num"] = state_update["round_num"]

                    # Reflection verdicts
                    if "verdicts" in state_update:
                        verdicts = state_update["verdicts"]
                        payload["verdicts"] = [
                            {"sub_question_id": v.sub_question_id, "verdict": v.verdict}
                            for v in verdicts
                        ]

                    # Final report
                    if "report_markdown" in state_update:
                        raw_rep = state_update["report_markdown"]
                        if isinstance(raw_rep, list):
                            rep_str = "".join(
                                part.get("text", str(part)) if isinstance(part, dict) else str(part)
                                for part in raw_rep
                            )
                        else:
                            rep_str = str(raw_rep)

                        final_payload = {
                            "node": "END",
                            "stage": "Complete",
                            "status": "completed",
                            "report": rep_str,
                        }
                        yield f"data: {json.dumps(payload)}\n\n"
                        yield f"data: {json.dumps(final_payload)}\n\n"
                        return

                yield f"data: {json.dumps(payload)}\n\n"

    except Exception as e:
        print(f"[API] SSE stream error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@app.get("/research/stream")
async def stream_research(query: str = Query(..., min_length=5, max_length=1000)):
    """
    Server-Sent Events endpoint. Streams progress updates to the client
    in real-time as the LangGraph executes.
    """
    return StreamingResponse(
        research_event_generator(query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# ── Report Management ───────────────────────────────────────────
ROOT_DIR = os.path.dirname(backend_dir)
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")
if not os.path.isdir(REPORTS_DIR):
    # Fallback to local reports dir inside backend
    REPORTS_DIR = os.path.join(backend_dir, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

@app.get("/reports")
async def list_reports():
    """List all saved research reports."""
    if not os.path.isdir(REPORTS_DIR):
        return []

    reports = []
    for filepath in sorted(glob.glob(os.path.join(REPORTS_DIR, "*.md")), reverse=True):
        stat = os.stat(filepath)
        reports.append(ReportSummary(
            filename=os.path.basename(filepath),
            path=filepath,
            size_bytes=stat.st_size,
            modified=str(stat.st_mtime),
        ))
    return reports


@app.get("/reports/{filename}")
async def get_report(filename: str):
    """Retrieve a specific saved report by filename."""
    filepath = os.path.join(REPORTS_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Report not found.")
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    return {"filename": filename, "content": content}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8080, reload=True)
