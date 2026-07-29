import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/scenes — list visible scenes (public)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("scenes")
    .select("*")
    .eq("visible", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
