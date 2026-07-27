import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/admin/categories — list all categories
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/admin/categories — create a new category
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Get max order
  const { data: maxOrder } = await supabaseAdmin
    .from("categories")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({ name: name.trim(), order: nextOrder })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/categories — delete a category
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e instanceof NextResponse ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
