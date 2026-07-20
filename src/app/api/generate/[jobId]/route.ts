import { NextRequest, NextResponse } from "next/server";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_KEY = process.env.LEAKIFYHUB_API_KEY!;

// ── GET /api/generate/[jobId] ────────────────────────
// Polls LeakifyHub for job status
// Returns: { status: "processing" | "completed" | "failed", videoUrl?: string, error?: string }
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const response = await fetch(`${LEAKIFYHUB_BASE}/jobs/${jobId}`, {
      headers: {
        "Authorization": `Bearer ${LEAKIFYHUB_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch job status" },
        { status: response.status },
      );
    }

    // Map LeakifyHub status to our format
    const status = data.status === "completed" ? "completed"
      : data.status === "failed" ? "failed"
      : "processing";

    return NextResponse.json({
      status,
      videoUrl: data.result_url || data.video_url || "",
      error: data.error || null,
    });
  } catch (err) {
    console.error("Poll job error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
