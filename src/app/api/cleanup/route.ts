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

    // Busca registros expirados com o role do usuário
    const { data: expired, error: fetchError } = await supabaseAdmin
      .from("videos")
      .select("id, job_id, user_image_url, video_url, user_id")
      .lt("expires_at", now);

    if (fetchError) {
      console.error("Cleanup fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch expired records" }, { status: 500 });
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    // Separa admins (não deletar) de clients (deletar)
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .in("id", expired.map((e) => e.user_id));

    const adminIds = new Set(
      (profiles || []).filter((p) => p.role === "admin").map((p) => p.id)
    );

    const toDelete = expired.filter((e) => !adminIds.has(e.user_id));
    const skipped = expired.length - toDelete.length;

    if (toDelete.length === 0) {
      console.log(`[Cleanup] Skipped ${skipped} admin videos, none to delete`);
      return NextResponse.json({ deleted: 0, skipped });
    }

    // Deleta arquivos do storage
    const storagePaths: string[] = [];
    for (const item of toDelete) {
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

    // Deleta os registros do banco (apenas clients)
    const jobIds = toDelete.map((e) => e.job_id);
    const { error: deleteError } = await supabaseAdmin
      .from("videos")
      .delete()
      .in("job_id", jobIds);

    if (deleteError) {
      console.error("Cleanup delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete expired records" }, { status: 500 });
    }

    console.log(`[Cleanup] Deleted ${toDelete.length} expired records, skipped ${skipped} admin videos`);
    return NextResponse.json({ deleted: toDelete.length, skipped });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
