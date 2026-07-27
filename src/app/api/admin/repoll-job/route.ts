import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_PUBLIC_KEY = process.env.LEAKIFYHUB_LIVE_PUBLIC_KEY!;
const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;

// POST /api/admin/repoll-job — re-poll a job and update the video_url
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

  const videoUrl = data.result_url || data.video_url || data.output_url || data.url || data.download_url || data.video || data.result || "";

  if (!videoUrl) {
    return NextResponse.json({
      error: "No video URL found in response",
      raw: data,
    }, { status: 404 });
  }

  // Update the database
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("videos")
    .update({ video_url: videoUrl, status: "completed" })
    .eq("job_id", jobId)
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    videoUrl,
    updated,
    raw: data,
  });
}
