import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// ── GET /api/videos ──────────────────────────────────
// Lista vídeos do usuário autenticado
// Header: Authorization: Bearer <supabase-access-token>
export async function GET(req: NextRequest) {
  try {
    // Autentica via token JWT do header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: videos, error } = await supabaseAdmin
      .from("videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
    }

    return NextResponse.json({ videos });
  } catch (err) {
    console.error("GET /api/videos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/videos ─────────────────────────────────
// Cria um novo registro de vídeo
// Body: { jobId, templateId, templateName, templateThumbnail, templateDuration, templateCredits }
// Header: Authorization: Bearer <supabase-access-token>
export async function POST(req: NextRequest) {
  try {
    // Autentica via token JWT do header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, templateId, templateName, templateThumbnail, templateDuration, templateCredits, userImageUrl } = body;

    if (!jobId || !templateId) {
      return NextResponse.json({ error: "Missing required fields: jobId, templateId" }, { status: 400 });
    }

    const { data: video, error } = await supabaseAdmin
      .from("videos")
      .insert({
        user_id: user.id,
        job_id: jobId,
        template_id: templateId,
        template_name: templateName || "",
        template_thumbnail: templateThumbnail || "",
        template_duration: templateDuration || "",
        template_credits: templateCredits || 0,
        user_image_url: userImageUrl || "",
        status: "processing",
        video_url: "",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating video:", error);
      return NextResponse.json({ error: "Failed to create video record" }, { status: 500 });
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (err) {
    console.error("POST /api/videos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
