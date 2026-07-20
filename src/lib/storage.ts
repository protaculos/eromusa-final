/**
 * LocalStorage-based persistence for created videos.
 * No backend required — data survives page reloads.
 */

export interface CreatedVideo {
  jobId: string;
  templateId: string;
  templateName: string;
  templateThumbnail: string;
  templateDuration: string;
  templateCredits: number;
  createdAt: string; // ISO string
}

const STORAGE_KEY = 'eromusa_created_videos';

export function getCreatedVideos(): CreatedVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CreatedVideo[];
  } catch {
    return [];
  }
}

export function addCreatedVideo(video: CreatedVideo): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCreatedVideos();
    // Avoid duplicates by jobId
    const updated = existing.filter((v) => v.jobId !== video.jobId);
    updated.unshift(video); // newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
