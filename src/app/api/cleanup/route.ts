import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// ── POST /api/cleanup ─────────────────────────────────
// Deleta todos os registros expirados (expires_at < now)
// e seus arquivos do storage.
// Pode ser chamado por um cron job externo (cron-job.org, etc.)
export async function POST(req: NextRequest) {
  try {
    // Opcional: chave secreta para evitar chamadas não autorizadas
    const authHeader = req.headers.get("authorization") || "";
    const secret = process.env.CLEANUP_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Busca todos os registros expirados
    const { data: expired, error: fetchError } = await supabaseAdmin
      .from("videos")
      .select("id, job_id, user_image_url, video_url")
      .lt("expires_at", now);

    if (fetchError) {
      console.error("Cleanup fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch expired records" }, { status: 500 });
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    // Deleta arquivos do storage
    const storagePaths: string[] = [];
    for (const item of expired) {
      for (const url of [item.user_image_url, item.video_url]) {
        if (!url) continue;
        try {
          const parsed = new URL(url);
          const storagePath = parsed.pathname.replace(/^\/storage\/v1\/object\/public\/generations\//, "");
          if (storagePath) storagePaths.push(storagePath);
        } catch { /* ignore */ }
      }
    }

    if (storagePaths.length > 0) {
      await supabaseAdmin.storage
        .from("generations")
        .remove(storagePaths);
    }

    // Deleta os registros do banco
    const jobIds = expired.map((e) => e.job_id);
    const { error: deleteError } = await supabaseAdmin
      .from("videos")
      .delete()
      .in("job_id", jobIds);

    if (deleteError) {
      console.error("Cleanup delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete expired records" }, { status: 500 });
    }

    console.log(`[Cleanup] Deleted ${expired.length} expired records`);
    return NextResponse.json({ deleted: expired.length });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
