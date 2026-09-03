const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function sseError(message: string): Response {
  const payload = JSON.stringify({ error: message });
  return new Response(`data: ${payload}\n\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || query.trim().length < 5) {
    return sseError("Research question too short. Please provide at least 5 characters.");
  }

  try {
    const backendUrl = `${BACKEND}/research/stream?query=${encodeURIComponent(query.trim())}`;
    const backendRes = await fetch(backendUrl, {
      headers: { Accept: "text/event-stream" },
      signal: request.signal,
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "");
      return sseError(`Backend service returned status ${backendRes.status}: ${errorText || "Internal error"}`);
    }

    if (!backendRes.body) {
      return sseError("Backend responded without a stream body.");
    }

    // Pipe the SSE stream from FastAPI -> client
    return new Response(backendRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return sseError(`Cannot reach backend server (${BACKEND}): ${message}. Ensure uvicorn is running.`);
  }
}
