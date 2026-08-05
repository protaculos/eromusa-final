import { NextRequest, NextResponse } from "next/server";
import { downloadAndStoreVideo } from "@/lib/video-processor";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_PUBLIC_KEY = process.env.LEAKIFYHUB_LIVE_PUBLIC_KEY!;
const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;

// ── GET /api/generate/[jobId] ────────────────────────
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
        "X-API-Key": LEAKIFYHUB_PUBLIC_KEY,
        "X-API-Secret": LEAKIFYHUB_SECRET_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch job status" },
        { status: response.status },
      );
    }

    const status = data.status === "completed" ? "completed"
      : data.status === "failed" ? "failed"
      : "processing";

    if (status !== "completed") {
      return NextResponse.json({ status, videoUrl: "", error: null });
    }

    const externalUrl = data.result_url || data.video_url || data.output_url || data.url || data.download_url || data.video || data.result || "";

    if (!externalUrl) {
      return NextResponse.json({ status, videoUrl: "", error: "No video URL in response" });
    }

    const result = await downloadAndStoreVideo(jobId, externalUrl, data.encryption_metadata);

    if (!result.success) {
      // Keep status as processing so the frontend retries — but if the job is
      // genuinely complete and we can't fetch the file, surface a helpful error.
      console.error(`[Poll ${jobId}] Failed to store video: ${result.error}`);
      return NextResponse.json({ status, videoUrl: "", error: result.error });
    }

    return NextResponse.json({ status, videoUrl: result.videoUrl, error: null });
  } catch (err) {
    console.error("Poll job error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
