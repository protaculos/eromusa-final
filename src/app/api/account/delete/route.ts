import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// ── DELETE /api/account/delete ──────────────────────
// Deleta a conta do usuário: perfil, vídeos, arquivos do storage
// Header: Authorization: Bearer <supabase-access-token>
export async function DELETE(req: NextRequest) {
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

    const userId = user.id;

    // 1. Busca todos os vídeos do usuário para deletar arquivos do storage
    const { data: videos } = await supabaseAdmin
      .from("videos")
      .select("user_image_url, video_url")
      .eq("user_id", userId);

    // 2. Deleta arquivos do storage
    const storagePaths: string[] = [];
    if (videos) {
      for (const v of videos) {
        for (const url of [v.user_image_url, v.video_url]) {
          if (!url) continue;
          try {
            const parsed = new URL(url);
            const storagePath = parsed.pathname.replace(/^\/storage\/v1\/object\/public\/generations\//, "");
            if (storagePath) storagePaths.push(storagePath);
          } catch { /* ignore */ }
        }
      }
    }

    if (storagePaths.length > 0) {
      await supabaseAdmin.storage
        .from("generations")
        .remove(storagePaths);
    }

    // 3. Deleta registros de vídeos
    await supabaseAdmin
      .from("videos")
      .delete()
      .eq("user_id", userId);

    // 4. Deleta registros de pagamentos
    await supabaseAdmin
      .from("payments")
      .delete()
      .eq("user_id", userId);

    // 5. Deleta o perfil
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    // 6. Deleta o usuário do auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/account/delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
