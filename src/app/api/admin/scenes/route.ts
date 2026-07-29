import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/admin/scenes — list all scenes
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("scenes")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/admin/scenes — create a new scene
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, credits, style_id, loop_video_url, gradient } = body;

  if (!name || !style_id) {
    return NextResponse.json({ error: "name and style_id are required" }, { status: 400 });
  }

  // Get next sort_order
  const { data: maxOrder } = await supabaseAdmin
    .from("scenes")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("scenes")
    .insert({
      name: name.trim(),
      credits: credits ?? 10,
      style_id,
      loop_video_url: loop_video_url || "",
      gradient: gradient || "from-orange-500 via-pink-500 to-purple-600",
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
