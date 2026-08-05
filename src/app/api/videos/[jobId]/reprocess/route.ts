import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { downloadAndStoreVideo } from "@/lib/video-processor";
import { getUserFromRequest } from "@/lib/admin-auth";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_PUBLIC_KEY = process.env.LEAKIFYHUB_LIVE_PUBLIC_KEY!;
const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;

// ── POST /api/videos/[jobId]/reprocess ───────────────
// Re-downloads the video from LeakifyHub, decrypts, and re-uploads to Supabase.
// Used to recover videos whose stored URL is broken (e.g. encrypted URL saved as-is).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Verify the user owns this video
    const profile = await getUserFromRequest(req);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: video, error: fetchError } = await supabaseAdmin
      .from("videos")
      .select("*")
      .eq("job_id", jobId)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check ownership: admin can reprocess any video; users only their own
    const isAdmin = profile.role === "admin";
    if (!isAdmin && video.user_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the job from LeakifyHub to get the current result URL + encryption metadata
    const response = await fetch(`${LEAKIFYHUB_BASE}/jobs/${jobId}`, {
      headers: {
        "X-API-Key": LEAKIFYHUB_PUBLIC_KEY,
        "X-API-Secret": LEAKIFYHUB_SECRET_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch job from LeakifyHub" },
        { status: response.status },
      );
    }

    if (data.status !== "completed") {
      return NextResponse.json(
        { error: `Job is not completed yet (status: ${data.status})` },
        { status: 409 },
      );
    }

    const externalUrl = data.result_url || data.video_url || data.output_url || data.url || data.download_url || data.video || data.result || "";

    if (!externalUrl) {
      return NextResponse.json({ error: "No video URL in job response" }, { status: 502 });
    }

    const result = await downloadAndStoreVideo(jobId, externalUrl, data.encryption_metadata);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    // Update the stored record with the new working URL
    const { error: updateError } = await supabaseAdmin
      .from("videos")
      .update({ video_url: result.videoUrl, status: "completed" })
      .eq("job_id", jobId);

    if (updateError) {
      console.error(`[Reprocess ${jobId}] Failed to update record:`, updateError);
      return NextResponse.json(
        { error: "Video stored but failed to update record" },
        { status: 500 },
      );
    }

    console.log(`[Reprocess ${jobId}] Done → ${result.videoUrl}`);
    return NextResponse.json({ status: "completed", videoUrl: result.videoUrl });
  } catch (err) {
    console.error("Reprocess error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
