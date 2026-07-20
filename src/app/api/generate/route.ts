import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_KEY = process.env.LEAKIFYHUB_API_KEY!;

// ── POST /api/generate ──────────────────────────────
// Body: { imageBase64: string, styleId: string, templateId: string, templateName: string, templateThumbnail: string, templateDuration: string, templateCredits: number }
// 1. Upload image to Supabase Storage
// 2. Call LeakifyHub POST /jobs/generate
// 3. Return { jobId, leakifyJobId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, styleId, templateId, templateName, templateThumbnail, templateDuration, templateCredits } = body;

    if (!imageBase64 || !styleId) {
      return NextResponse.json({ error: "Missing required fields: imageBase64, styleId" }, { status: 400 });
    }

    // ── 1. Upload image to Supabase Storage ──────────
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("generations")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({
        error: "Failed to upload image to storage",
        detail: uploadError.message,
        hint: "Make sure the 'generations' bucket exists in Supabase Storage"
      }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("generations")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // ── 2. Call LeakifyHub POST /jobs/generate ──────
    const leakifyResponse = await fetch(`${LEAKIFYHUB_BASE}/jobs/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LEAKIFYHUB_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        style_id: styleId,
        image_url: imageUrl,
      }),
    });

    let leakifyData: any;
    try {
      leakifyData = await leakifyResponse.json();
    } catch {
      leakifyData = { raw: await leakifyResponse.text() };
    }

    console.log("[Generate] LeakifyHub response:", leakifyResponse.status, JSON.stringify(leakifyData, null, 2));
    console.log("[Generate] Sent to LeakifyHub:", JSON.stringify({ style_id: styleId, image_url: imageUrl }));

    if (!leakifyResponse.ok) {
      console.error("LeakifyHub error:", leakifyData);
      return NextResponse.json(
        { error: leakifyData.error || leakifyData.message || leakifyData.detail || "Generation failed", leakifyResponse: leakifyData },
        { status: leakifyResponse.status },
      );
    }

    const leakifyJobId = leakifyData.job_id || leakifyData.id;

    // ── 3. Return job info ───────────────────────────
    return NextResponse.json({
      jobId: leakifyJobId,
      templateId,
      templateName,
      templateThumbnail,
      templateDuration,
      templateCredits,
      status: "processing",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Generate API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
