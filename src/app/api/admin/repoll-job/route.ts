import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_PUBLIC_KEY = process.env.LEAKIFYHUB_LIVE_PUBLIC_KEY!;
const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;

// POST /api/admin/repoll-job — re-poll a job, download video, upload to Supabase, update DB
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { jobId } = body;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  // Poll LeakifyHub
  const response = await fetch(`${LEAKIFYHUB_BASE}/jobs/${jobId}`, {
    headers: {
      "X-API-Key": LEAKIFYHUB_PUBLIC_KEY,
      "X-API-Secret": LEAKIFYHUB_SECRET_KEY,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.error || "Failed to fetch job" }, { status: response.status });
  }

  const externalUrl = data.result_url || data.video_url || data.output_url || data.url || data.download_url || data.video || data.result || "";

  if (!externalUrl) {
    return NextResponse.json({ error: "No video URL found in response", raw: data }, { status: 404 });
  }

  // Download the video
  console.log(`[Repoll ${jobId}] Downloading from: ${externalUrl.substring(0, 80)}...`);
  const videoResponse = await fetch(externalUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Eromusa/1.0)" },
  });

  if (!videoResponse.ok) {
    return NextResponse.json({ error: `Failed to download video: ${videoResponse.status}` }, { status: 502 });
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
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("generations")
    .getPublicUrl(fileName);

  const supabaseUrl = publicUrlData.publicUrl;

  // Update the database
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("videos")
    .update({ video_url: supabaseUrl, status: "completed" })
    .eq("job_id", jobId)
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    supabaseUrl,
    updated,
  });
}
