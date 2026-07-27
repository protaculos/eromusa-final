import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// POST /api/admin/category-scenes — link a scene to a category
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { category_id, scene_id } = body;

  if (!category_id || !scene_id) {
    return NextResponse.json({ error: "category_id and scene_id are required" }, { status: 400 });
  }

  // Get max order for this category
  const { data: maxOrder } = await supabaseAdmin
    .from("category_scenes")
    .select("order")
    .eq("category_id", category_id)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("category_scenes")
    .insert({ category_id, scene_id, order: nextOrder })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Scene already in this category" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/category-scenes — unlink a scene from a category
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category_id = searchParams.get("category_id");
  const scene_id = searchParams.get("scene_id");

  if (!category_id || !scene_id) {
    return NextResponse.json({ error: "category_id and scene_id are required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("category_scenes")
    .delete()
    .eq("category_id", category_id)
    .eq("scene_id", scene_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
