import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// ── PATCH /api/videos/[jobId] ────────────────────────
// Atualiza status e videoUrl de um vídeo
// Body: { status: "completed" | "failed", videoUrl?: string }
// Header: Authorization: Bearer <supabase-access-token>
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    // Autentica via token JWT do header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const body = await req.json();
    const { status, videoUrl } = body;

    if (!status || !["processing", "completed", "failed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verifica se o vídeo pertence ao usuário
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("videos")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const { data: video, error } = await supabaseAdmin
      .from("videos")
      .update({
        status,
        video_url: videoUrl || "",
      })
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating video:", error);
      return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
    }

    return NextResponse.json({ video });
  } catch (err) {
    console.error("PATCH /api/videos/[jobId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
