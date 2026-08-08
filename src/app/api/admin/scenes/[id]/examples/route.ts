import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// ── GET /api/admin/scenes/[id]/examples ──────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin(req); } catch (e) { return e as NextResponse; }

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
  try { await requireAdmin(req); } catch (e) { return e as NextResponse; }

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

// ── PATCH /api/admin/scenes/[id]/examples ────────────
// Body: { order: string[] } — array of example ids in the desired order.
// Index 0 becomes the official video of the scene.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin(req); } catch (e) { return e as NextResponse; }

  const { id } = await params;
  const body = await req.json();
  const ids: unknown = body?.order;

  if (!Array.isArray(ids) || ids.some((v) => typeof v !== "string")) {
    return NextResponse.json({ error: "order must be an array of example ids" }, { status: 400 });
  }

  // Only reorder rows that actually belong to this scene.
  const { data: owned, error: ownedError } = await supabaseAdmin
    .from("scene_examples")
    .select("id")
    .eq("scene_id", id);

  if (ownedError) {
    return NextResponse.json({ error: ownedError.message }, { status: 500 });
  }

  const ownedIds = new Set((owned ?? []).map((row) => row.id as string));
  const orderedIds = (ids as string[]).filter((exampleId) => ownedIds.has(exampleId));

  if (orderedIds.length !== ownedIds.size) {
    return NextResponse.json({ error: "order must include every example of this scene" }, { status: 400 });
  }

  for (let index = 0; index < orderedIds.length; index++) {
    const { error } = await supabaseAdmin
      .from("scene_examples")
      .update({ order: index })
      .eq("id", orderedIds[index])
      .eq("scene_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Keep scenes.loop_video_url in sync with the first video of the list.
  const { data: first, error: firstError } = await supabaseAdmin
    .from("scene_examples")
    .select("video_url")
    .eq("scene_id", id)
    .order("order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  if (first?.video_url) {
    const { error: sceneError } = await supabaseAdmin
      .from("scenes")
      .update({ loop_video_url: first.video_url })
      .eq("id", id);

    if (sceneError) {
      return NextResponse.json({ error: sceneError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// ── DELETE /api/admin/scenes/[id]/examples/[exampleId] ─
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin(req); } catch (e) { return e as NextResponse; }

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
