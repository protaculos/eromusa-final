import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/debug-videos — list recent videos (no auth needed, for debugging)
export async function GET() {
  const { data: videos } = await supabaseAdmin
    .from("videos")
    .select("id, job_id, status, video_url, template_name, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ videos });
}
