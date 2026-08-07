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

    if (status === "failed") {
      return NextResponse.json({ status: "failed", videoUrl: "", error: data.error || "Generation failed" });
    }

    if (status !== "completed") {
      return NextResponse.json({ status, videoUrl: "", error: null });
    }

    const externalUrl = data.result_url || data.video_url || data.output_url || data.url || data.download_url || data.video || data.result || "";

    if (!externalUrl) {
      // Provider says completed but there's no URL yet — treat as still processing
      // so the frontend keeps retrying instead of saving a broken state
      console.warn(`[Poll ${jobId}] Provider says completed but no URL provided yet`);
      return NextResponse.json({ status: "processing", videoUrl: "", error: null });
    }

    const result = await downloadAndStoreVideo(jobId, externalUrl, data.encryption_metadata);

    if (!result.success) {
      if (result.error === "Video not ready for download yet") {
        // The file isn't ready yet — keep as processing so the frontend retries
        console.warn(`[Poll ${jobId}] Video not ready for download, will retry later`);
        return NextResponse.json({ status: "processing", videoUrl: "", error: null });
      }

      if (result.error === "Downloaded file is not a valid MP4") {
        // File was downloaded but isn't valid — mark as failed so user gets refund
        console.error(`[Poll ${jobId}] Downloaded file is invalid, marking as failed`);
        return NextResponse.json({ status: "failed", videoUrl: "", error: "Generated file is not a valid video" });
      }

      // Other errors (upload failed, etc) — keep as processing for retry
      console.error(`[Poll ${jobId}] Failed to store video: ${result.error}`);
      return NextResponse.json({ status: "processing", videoUrl: "", error: result.error });
    }

    return NextResponse.json({ status, videoUrl: result.videoUrl, error: null });
  } catch (err) {
    console.error("Poll job error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
