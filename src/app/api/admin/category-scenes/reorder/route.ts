import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// PATCH /api/admin/category-scenes/reorder — reorder scenes in a category
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { category_id, scene_id, direction } = body;

  if (!category_id || !scene_id || !direction || !["up", "down"].includes(direction)) {
    return NextResponse.json({ error: "category_id, scene_id, and direction (up/down) are required" }, { status: 400 });
  }

  // Get current link
  const { data: currentLink, error: fetchError } = await supabaseAdmin
    .from("category_scenes")
    .select("*")
    .eq("category_id", category_id)
    .eq("scene_id", scene_id)
    .single();

  if (fetchError || !currentLink) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const currentOrder = currentLink.order;

  // Find the adjacent link to swap with
  const { data: adjacentLink } = await supabaseAdmin
    .from("category_scenes")
    .select("*")
    .eq("category_id", category_id)
    .eq(direction === "up" ? "order" : "order", direction === "up" ? currentOrder - 1 : currentOrder + 1)
    .single();

  if (!adjacentLink) {
    return NextResponse.json({ error: "Already at the edge" }, { status: 400 });
  }

  // Swap orders
  const { error: update1 } = await supabaseAdmin
    .from("category_scenes")
    .update({ order: adjacentLink.order })
    .eq("id", currentLink.id);

  const { error: update2 } = await supabaseAdmin
    .from("category_scenes")
    .update({ order: currentOrder })
    .eq("id", adjacentLink.id);

  if (update1 || update2) {
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
