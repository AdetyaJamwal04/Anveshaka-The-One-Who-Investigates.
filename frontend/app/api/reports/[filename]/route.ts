const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  try {
    const res = await fetch(
      `${BACKEND}/reports/${encodeURIComponent(filename)}`
    );
    if (!res.ok) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
