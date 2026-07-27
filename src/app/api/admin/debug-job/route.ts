import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_PUBLIC_KEY = process.env.LEAKIFYHUB_LIVE_PUBLIC_KEY!;
const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;

// GET /api/admin/debug-job?jobId=xxx
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    // List all videos with their video_url
    const { data: videos } = await supabaseAdmin
      .from("videos")
      .select("id, job_id, status, video_url, template_name, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ videos });
  }

  // Poll LeakifyHub for this specific job
  const response = await fetch(`${LEAKIFYHUB_BASE}/jobs/${jobId}`, {
    headers: {
      "X-API-Key": LEAKIFYHUB_PUBLIC_KEY,
      "X-API-Secret": LEAKIFYHUB_SECRET_KEY,
    },
  });

  const data = await response.json();

  // Also get the DB record
  const { data: dbRecord } = await supabaseAdmin
    .from("videos")
    .select("*")
    .eq("job_id", jobId)
    .single();

  return NextResponse.json({
    leakifyhub_response: data,
    leakifyhub_status: response.status,
    database_record: dbRecord,
  });
}
