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
    const body = await req.json();
    const { status, videoUrl } = body;

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (videoUrl !== undefined) updateData.video_url = videoUrl;

    const { data, error } = await supabaseAdmin
      .from("videos")
      .update(updateData)
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating video:", error);
      return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
    }

    return NextResponse.json({ video: data });
  } catch (err) {
    console.error("PATCH /api/videos/[jobId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/videos/[jobId] ───────────────────────
// Deleta o registro do vídeo E a imagem do storage
// Header: Authorization: Bearer <supabase-access-token>
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
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

    // Busca o registro para saber o user_image_url (path no storage)
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("videos")
      .select("id, user_image_url, video_url")
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Deleta a imagem do usuário do storage (se for do bucket "generations")
    if (existing.user_image_url) {
      try {
        const url = new URL(existing.user_image_url);
        const storagePath = url.pathname.replace(/^\/storage\/v1\/object\/public\/generations\//, "");
        if (storagePath) {
          await supabaseAdmin.storage
            .from("generations")
            .remove([storagePath]);
        }
      } catch (e) {
        console.warn("Could not delete user image from storage:", e);
      }
    }

    // Deleta o vídeo do storage (se for do bucket "generations")
    if (existing.video_url) {
      try {
        const url = new URL(existing.video_url);
        const storagePath = url.pathname.replace(/^\/storage\/v1\/object\/public\/generations\//, "");
        if (storagePath) {
          await supabaseAdmin.storage
            .from("generations")
            .remove([storagePath]);
        }
      } catch (e) {
        console.warn("Could not delete video from storage:", e);
      }
    }

    // Deleta o registro do banco
    const { error } = await supabaseAdmin
      .from("videos")
      .delete()
      .eq("job_id", jobId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting video:", error);
      return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/videos/[jobId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
