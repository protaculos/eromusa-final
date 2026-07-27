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

  // Get all links for this category ordered by position
  const { data: allLinks, error: listError } = await supabaseAdmin
    .from("category_scenes")
    .select("*")
    .eq("category_id", category_id)
    .order("order", { ascending: true });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  // Find current link by scene_id
  const currentIdx = allLinks.findIndex((l) => l.scene_id === scene_id);
  if (currentIdx === -1) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const adjacentIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
  if (adjacentIdx < 0 || adjacentIdx >= allLinks.length) {
    return NextResponse.json({ error: "Already at the edge" }, { status: 400 });
  }

  const currentLink = allLinks[currentIdx];
  const adjacentLink = allLinks[adjacentIdx];

  // Swap orders (3-step to avoid unique constraint)
  const { error: step1 } = await supabaseAdmin
    .from("category_scenes")
    .update({ order: -1 })
    .eq("id", currentLink.id);

  if (step1) {
    return NextResponse.json({ error: step1.message }, { status: 500 });
  }

  const { error: step2 } = await supabaseAdmin
    .from("category_scenes")
    .update({ order: currentLink.order })
    .eq("id", adjacentLink.id);

  if (step2) {
    await supabaseAdmin.from("category_scenes").update({ order: currentLink.order }).eq("id", currentLink.id);
    return NextResponse.json({ error: step2.message }, { status: 500 });
  }

  const { error: step3 } = await supabaseAdmin
    .from("category_scenes")
    .update({ order: adjacentLink.order })
    .eq("id", currentLink.id);

  if (step3) {
    await supabaseAdmin.from("category_scenes").update({ order: adjacentLink.order }).eq("id", adjacentLink.id);
    await supabaseAdmin.from("category_scenes").update({ order: currentLink.order }).eq("id", currentLink.id);
    return NextResponse.json({ error: step3.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
