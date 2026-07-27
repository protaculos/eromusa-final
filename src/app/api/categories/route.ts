import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/categories — list all categories with their scenes
export async function GET() {
  const { data: categories, error: catError } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("order", { ascending: true });

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  // For each category, get linked scenes
  const result = await Promise.all(
    categories.map(async (cat) => {
      const { data: links, error: linkError } = await supabaseAdmin
        .from("category_scenes")
        .select("scene_id, order")
        .eq("category_id", cat.id)
        .order("order", { ascending: true });

      if (linkError) {
        return { ...cat, scenes: [] };
      }

      const sceneIds = links.map((l) => l.scene_id);

      if (sceneIds.length === 0) {
        return { ...cat, scenes: [] };
      }

      const { data: scenes } = await supabaseAdmin
        .from("scenes")
        .select("*")
        .in("id", sceneIds);

      // Reorder scenes by link order
      const sceneMap = new Map(scenes?.map((s) => [s.id, s]) ?? []);
      const orderedScenes = links
        .map((l) => sceneMap.get(l.scene_id))
        .filter(Boolean);

      return { ...cat, scenes: orderedScenes };
    })
  );

  return NextResponse.json(result);
}
