import { supabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";

const PBKDF2_SALT = Buffer.from("leakify_api_secret_salt_v1", "utf-8");
const FILE_KEY_IV = Buffer.from("file_key_iv_16b", "utf-8");

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

export async function downloadAndStoreVideo(
  jobId: string,
  externalUrl: string,
  encryptionMetadata?: { encrypted_key: string } | null,
): Promise<ProcessVideoResult> {
  // Check if already in Supabase storage
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

  const videoResponse = await fetch(externalUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Eromusa/1.0)" },
  });

  if (!videoResponse.ok) {
    console.error(`[Process ${jobId}] Download failed: ${videoResponse.status}`);
    return { success: false, videoUrl: "", error: `Download failed: ${videoResponse.status}` };
  }

  const buffer = Buffer.from(await videoResponse.arrayBuffer());
  console.log(`[Process ${jobId}] Downloaded: ${buffer.length} bytes`);

  let uploadBuffer: Buffer = Buffer.from(buffer);

  // Try decrypt if metadata present
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

  // Validate minimum MP4 header
  const isMp4Like = uploadBuffer.length > 24 &&
    (uploadBuffer.toString("ascii", 4, 8) === "ftyp" ||
      uploadBuffer.toString("ascii", 0, 4) === "\u0000\u0000\u0000 ftyp");

  if (!isMp4Like && uploadBuffer.length > 0) {
    console.warn(`[Process ${jobId}] Buffer doesn't look like MP4, uploading anyway`);
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
