import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";

const LEAKIFYHUB_BASE = "https://api.leakifyhub.fun/api/v1";
const LEAKIFYHUB_PUBLIC_KEY = process.env.LEAKIFYHUB_LIVE_PUBLIC_KEY!;
const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;

const PBKDF2_SALT = Buffer.from("leakify_api_secret_salt_v1", "utf-8");
const FILE_KEY_IV = Buffer.from("file_key_iv_16b", "utf-8");

function deriveUserKey(apiSecret: string): Buffer {
  return crypto.pbkdf2Sync(apiSecret, PBKDF2_SALT, 100000, 32, "sha256");
}

function decryptFileKey(userKey: Buffer, encryptedKeyB64: string): Buffer {
  const encryptedKey = Buffer.from(encryptedKeyB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", userKey, FILE_KEY_IV);
  // encryptedKey = ciphertext (32 bytes) + tag (16 bytes)
  const tag = encryptedKey.subarray(encryptedKey.length - 16);
  const ciphertext = encryptedKey.subarray(0, encryptedKey.length - 16);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function decryptVideo(fileKey: Buffer, encryptedData: Buffer): Buffer {
  const iv = encryptedData.subarray(0, 12);
  const tag = encryptedData.subarray(encryptedData.length - 16);
  const ciphertext = encryptedData.subarray(12, encryptedData.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", fileKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// ── GET /api/generate/[jobId] ────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const response = await fetch(`${LEAKIFYHUB_BASE}/jobs/${jobId}`, {
      headers: {
        "X-API-Key": LEAKIFYHUB_PUBLIC_KEY,
        "X-API-Secret": LEAKIFYHUB_SECRET_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch job status" },
        { status: response.status },
      );
    }

    const status = data.status === "completed" ? "completed"
      : data.status === "failed" ? "failed"
      : "processing";

    if (status !== "completed") {
      return NextResponse.json({ status, videoUrl: "", error: null });
    }

    const externalUrl = data.result_url || data.video_url || data.output_url || data.url || data.download_url || data.video || data.result || "";

    if (!externalUrl) {
      return NextResponse.json({ status, videoUrl: "", error: "No video URL in response" });
    }

    // Check if we already have this video in Supabase Storage
    const { data: existingRecord } = await supabaseAdmin
      .from("videos")
      .select("video_url")
      .eq("job_id", jobId)
      .single();

    if (existingRecord?.video_url?.includes("supabase.co")) {
      return NextResponse.json({ status, videoUrl: existingRecord.video_url, error: null });
    }

    // Download the encrypted video
    console.log(`[Poll ${jobId}] Downloading encrypted video from: ${externalUrl.substring(0, 80)}...`);

    const videoResponse = await fetch(externalUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Eromusa/1.0)" },
    });

    if (!videoResponse.ok) {
      console.error(`[Poll ${jobId}] Failed to download video: ${videoResponse.status}`);
      return NextResponse.json({ status: "processing", videoUrl: "", error: "Download failed" });
    }

    const encryptedBuffer = Buffer.from(await videoResponse.arrayBuffer());

    // Decrypt using PBKDF2 + AES-256-GCM
    if (!data.encryption_metadata) {
      console.log(`[Poll ${jobId}] No encryption metadata, uploading as-is`);
      const fileName = `videos/${jobId}.mp4`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("generations")
        .upload(fileName, encryptedBuffer, { contentType: "video/mp4", upsert: true });

      if (uploadError) {
        console.error(`[Poll ${jobId}] Upload error:`, uploadError);
        return NextResponse.json({ status: "processing", videoUrl: "", error: "Upload failed" });
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from("generations").getPublicUrl(fileName);
      return NextResponse.json({ status, videoUrl: publicUrlData.publicUrl, error: null });
    }

    console.log(`[Poll ${jobId}] Decrypting video with PBKDF2+AES-256-GCM...`);

    try {
      const userKey = deriveUserKey(LEAKIFYHUB_SECRET_KEY);
      const fileKey = decryptFileKey(userKey, data.encryption_metadata.encrypted_key);
      const decryptedBuffer = decryptVideo(fileKey, encryptedBuffer);

      console.log(`[Poll ${jobId}] Decrypted! Size: ${decryptedBuffer.length} bytes`);

      const fileName = `videos/${jobId}.mp4`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("generations")
        .upload(fileName, decryptedBuffer, { contentType: "video/mp4", upsert: true });

      if (uploadError) {
        console.error(`[Poll ${jobId}] Upload error:`, uploadError);
        return NextResponse.json({ status: "processing", videoUrl: "", error: "Upload failed" });
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from("generations").getPublicUrl(fileName);
      const supabaseUrl = publicUrlData.publicUrl;
      console.log(`[Poll ${jobId}] Uploaded to Supabase: ${supabaseUrl}`);

      return NextResponse.json({ status, videoUrl: supabaseUrl, error: null });
    } catch (decryptErr) {
      console.error(`[Poll ${jobId}] Decryption failed:`, decryptErr);
      return NextResponse.json({ status: "processing", videoUrl: "", error: "Decryption failed" });
    }
  } catch (err) {
    console.error("Poll job error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
