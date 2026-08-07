import { supabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";

const PBKDF2_SALT = Buffer.from("leakify_api_secret_salt_v1", "utf-8");
const FILE_KEY_IV = Buffer.from("file_key_iv_16b", "utf-8");
const MIN_MP4_BYTES = 128;
const RETRY_DELAYS_MS = [0, 1500, 3000];

export function deriveUserKey(apiSecret: string): Buffer {
  return crypto.pbkdf2Sync(apiSecret, PBKDF2_SALT, 100000, 32, "sha256");
}

export function decryptFileKey(userKey: Buffer, encryptedKeyB64: string): Buffer {
  const encryptedKey = Buffer.from(encryptedKeyB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", userKey, FILE_KEY_IV);
  const tag = encryptedKey.subarray(encryptedKey.length - 16);
  const ciphertext = encryptedKey.subarray(0, encryptedKey.length - 16);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function decryptVideo(fileKey: Buffer, encryptedData: Buffer): Buffer {
  const iv = encryptedData.subarray(0, 12);
  const tag = encryptedData.subarray(encryptedData.length - 16);
  const ciphertext = encryptedData.subarray(12, encryptedData.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", fileKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export interface ProcessVideoResult {
  success: boolean;
  videoUrl: string;
  error?: string;
}

function isProbablyMp4(buffer: Buffer): boolean {
  return buffer.length >= MIN_MP4_BYTES && buffer.toString("ascii", 4, 8) === "ftyp";
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(jobId: string, externalUrl: string): Promise<Buffer | null> {
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    await wait(RETRY_DELAYS_MS[attempt]);

    const videoResponse = await fetch(externalUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Eromusa/1.0)" },
    });

    if (!videoResponse.ok) {
      console.warn(`[Process ${jobId}] Download attempt ${attempt + 1} failed: ${videoResponse.status}`);
      continue;
    }

    const contentType = videoResponse.headers.get("content-type") || "";
    const buffer = Buffer.from(await videoResponse.arrayBuffer());

    if (buffer.length < MIN_MP4_BYTES) {
      console.warn(`[Process ${jobId}] Download attempt ${attempt + 1} returned too few bytes: ${buffer.length}`);
      continue;
    }

    if (!contentType.includes("video") && !isProbablyMp4(buffer)) {
      console.warn(`[Process ${jobId}] Download attempt ${attempt + 1} looks invalid: content-type=${contentType || "n/a"}`);
      continue;
    }

    return buffer;
  }

  return null;
}

export async function downloadAndStoreVideo(
  jobId: string,
  externalUrl: string,
  encryptionMetadata?: { encrypted_key: string } | null,
): Promise<ProcessVideoResult> {
  const fileName = `videos/${jobId}.mp4`;
  const { data: existingRecord } = await supabaseAdmin
    .from("videos")
    .select("video_url")
    .eq("job_id", jobId)
    .single();

  if (existingRecord?.video_url?.includes("supabase.co")) {
    return { success: true, videoUrl: existingRecord.video_url };
  }

  console.log(`[Process ${jobId}] Downloading video from: ${externalUrl.substring(0, 80)}...`);

  const buffer = await fetchWithRetry(jobId, externalUrl);
  if (!buffer) {
    return { success: false, videoUrl: "", error: "Video not ready for download yet" };
  }

  console.log(`[Process ${jobId}] Downloaded: ${buffer.length} bytes`);

  let uploadBuffer: Buffer = Buffer.from(buffer);

  if (encryptionMetadata?.encrypted_key) {
    try {
      const LEAKIFYHUB_SECRET_KEY = process.env.LEAKIFYHUB_LIVE_SECRET_KEY!;
      const userKey = deriveUserKey(LEAKIFYHUB_SECRET_KEY);
      const fileKey = decryptFileKey(userKey, encryptionMetadata.encrypted_key);
      const decryptedBuffer = decryptVideo(fileKey, buffer);
      uploadBuffer = decryptedBuffer;
      console.log(`[Process ${jobId}] Decrypted successfully: ${decryptedBuffer.length} bytes`);
    } catch (decryptErr) {
      console.warn(`[Process ${jobId}] Decryption failed, uploading as-is:`, decryptErr);
    }
  }

  if (!isProbablyMp4(uploadBuffer)) {
    return { success: false, videoUrl: "", error: "Downloaded file is not a valid MP4" };
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from("generations")
    .upload(fileName, uploadBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (uploadError) {
    console.error(`[Process ${jobId}] Upload failed:`, uploadError);
    return { success: false, videoUrl: "", error: "Upload failed" };
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from("generations").getPublicUrl(fileName);
  console.log(`[Process ${jobId}] Stored: ${publicUrlData.publicUrl}`);

  return { success: true, videoUrl: publicUrlData.publicUrl };
}
