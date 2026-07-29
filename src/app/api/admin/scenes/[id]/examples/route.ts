import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// ── GET /api/admin/scenes/[id]/examples ──────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("scene_examples")
    .select("*")
    .eq("scene_id", id)
    .order("order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// ── POST /api/admin/scenes/[id]/examples ─────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const { video_url, name } = body;

  if (!video_url) {
    return NextResponse.json({ error: "video_url is required" }, { status: 400 });
  }

  // Get the next order value
  const { data: maxOrder } = await supabaseAdmin
    .from("scene_examples")
    .select("order")
    .eq("scene_id", id)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("scene_examples")
    .insert({
      scene_id: id,
      video_url,
      name: name || "",
      order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// ── DELETE /api/admin/scenes/[id]/examples/[exampleId] ─
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const exampleId = url.searchParams.get("example_id");

  if (!exampleId) {
    return NextResponse.json({ error: "example_id query param is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("scene_examples")
    .delete()
    .eq("id", exampleId)
    .eq("scene_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
