import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// PATCH /api/admin/category-scenes/move-to-category — move a scene to another category at position 1
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { scene_id, from_category_id, to_category_id } = body;

  if (!scene_id || !from_category_id || !to_category_id) {
    return NextResponse.json({ error: "scene_id, from_category_id, and to_category_id are required" }, { status: 400 });
  }

  if (from_category_id === to_category_id) {
    return NextResponse.json({ error: "Categories must be different" }, { status: 400 });
  }

  // 1. Delete the old link
  const { error: deleteError } = await supabaseAdmin
    .from("category_scenes")
    .delete()
    .eq("category_id", from_category_id)
    .eq("scene_id", scene_id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 2. Shift existing scenes in target category down by 1
  const { data: existingLinks } = await supabaseAdmin
    .from("category_scenes")
    .select("id, order")
    .eq("category_id", to_category_id)
    .order("order", { ascending: false });

  if (existingLinks && existingLinks.length > 0) {
    for (const link of existingLinks) {
      const { error: shiftError } = await supabaseAdmin
        .from("category_scenes")
        .update({ order: link.order + 1 })
        .eq("id", link.id);

      if (shiftError) {
        return NextResponse.json({ error: shiftError.message }, { status: 500 });
      }
    }
  }

  // 3. Insert at position 1 (order = 0)
  const { error: insertError } = await supabaseAdmin
    .from("category_scenes")
    .insert({ category_id: to_category_id, scene_id, order: 0 });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Scene already in this category" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
