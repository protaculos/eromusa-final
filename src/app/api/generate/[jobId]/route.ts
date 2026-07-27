import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_PUBLIC_KEY = process.env.LEAKIFYHUB_LIVE_PUBLIC_KEY!;
const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;

// ── GET /api/generate/[jobId] ────────────────────────
// Polls LeakifyHub for job status.
// When completed: downloads video, uploads to Supabase Storage, returns Supabase URL
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

    // Get the external video URL
    const externalUrl = data.result_url || data.video_url || data.output_url || data.url || data.download_url || data.video || data.result || "";

    if (!externalUrl) {
      return NextResponse.json({ status, videoUrl: "", error: "No video URL in response" });
    }

    // Check if we already have this video in Supabase Storage
    const { data: existingRecord } = await supabaseAdmin
      .from("videos")
      .select("video_url")
      .eq("job_id", jobId)
      .single();

    // If already a Supabase URL, return it
    if (existingRecord?.video_url?.includes("supabase.co")) {
      return NextResponse.json({ status, videoUrl: existingRecord.video_url, error: null });
    }

    // Download the video and upload to Supabase Storage
    console.log(`[Poll ${jobId}] Downloading video from: ${externalUrl.substring(0, 80)}...`);

    const videoResponse = await fetch(externalUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Eromusa/1.0)" },
    });

    if (!videoResponse.ok) {
      console.error(`[Poll ${jobId}] Failed to download video: ${videoResponse.status}`);
      return NextResponse.json({ status, videoUrl: externalUrl, error: null });
    }

    const buffer = Buffer.from(await videoResponse.arrayBuffer());
    const fileName = `videos/${jobId}.mp4`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("generations")
      .upload(fileName, buffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      console.error(`[Poll ${jobId}] Supabase upload error:`, uploadError);
      // Fall back to external URL
      return NextResponse.json({ status, videoUrl: externalUrl, error: null });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("generations")
      .getPublicUrl(fileName);

    const supabaseUrl = publicUrlData.publicUrl;
    console.log(`[Poll ${jobId}] Uploaded to Supabase: ${supabaseUrl}`);

    return NextResponse.json({ status, videoUrl: supabaseUrl, error: null });
  } catch (err) {
    console.error("Poll job error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
