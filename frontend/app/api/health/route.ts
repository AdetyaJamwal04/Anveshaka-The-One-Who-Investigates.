const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/health`);
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
