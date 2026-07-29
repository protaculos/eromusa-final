import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// PATCH /api/admin/scenes/reorder — swap order of two scenes
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { scene_id, direction } = body;

  if (!scene_id || !direction || !["up", "down"].includes(direction)) {
    return NextResponse.json({ error: "scene_id and direction (up/down) are required" }, { status: 400 });
  }

  // Get all visible scenes ordered by sort_order
  const { data: allScenes, error: listError } = await supabaseAdmin
    .from("scenes")
    .select("id, sort_order")
    .eq("visible", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  // Find current scene index
  const currentIdx = allScenes.findIndex((s) => s.id === scene_id);
  if (currentIdx === -1) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  const adjacentIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
  if (adjacentIdx < 0 || adjacentIdx >= allScenes.length) {
    return NextResponse.json({ error: "Already at the edge" }, { status: 400 });
  }

  const currentScene = allScenes[currentIdx];
  const adjacentScene = allScenes[adjacentIdx];

  // Swap sort_order values
  const { error: err1 } = await supabaseAdmin
    .from("scenes")
    .update({ sort_order: -1 })
    .eq("id", currentScene.id);

  if (err1) return NextResponse.json({ error: err1.message }, { status: 500 });

  const { error: err2 } = await supabaseAdmin
    .from("scenes")
    .update({ sort_order: currentScene.sort_order })
    .eq("id", adjacentScene.id);

  if (err2) {
    await supabaseAdmin.from("scenes").update({ sort_order: currentScene.sort_order }).eq("id", currentScene.id);
    return NextResponse.json({ error: err2.message }, { status: 500 });
  }

  const { error: err3 } = await supabaseAdmin
    .from("scenes")
    .update({ sort_order: adjacentScene.sort_order })
    .eq("id", currentScene.id);

  if (err3) {
    await supabaseAdmin.from("scenes").update({ sort_order: adjacentScene.sort_order }).eq("id", adjacentScene.id);
    await supabaseAdmin.from("scenes").update({ sort_order: currentScene.sort_order }).eq("id", currentScene.id);
    return NextResponse.json({ error: err3.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
