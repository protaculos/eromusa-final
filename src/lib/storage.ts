/**
 * LocalStorage-based persistence for created videos.
 * No backend required — data survives page reloads.
 */

export type VideoStatus = "processing" | "completed" | "failed";

export interface CreatedVideo {
  jobId: string; // LeakifyHub job ID
  templateId: string;
  templateName: string;
  templateThumbnail: string;
  templateDuration: string;
  templateCredits: number;
  status: VideoStatus;
  videoUrl: string; // result video URL (empty while processing)
  createdAt: string; // ISO string
}

const STORAGE_KEY = "eromusa_created_videos";

export function getCreatedVideos(): CreatedVideo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CreatedVideo[];
  } catch {
    return [];
  }
}

export function addCreatedVideo(video: CreatedVideo): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCreatedVideos();
    const updated = existing.filter((v) => v.jobId !== video.jobId);
    updated.unshift(video);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function updateVideoStatus(
  jobId: string,
  status: VideoStatus,
  videoUrl: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCreatedVideos();
    const updated = existing.map((v) =>
      v.jobId === jobId ? { ...v, status, videoUrl } : v,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // silently ignore
  }
}
