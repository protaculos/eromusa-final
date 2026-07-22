"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import LoginModal from "@/components/LoginModal";

// ── Types ─────────────────────────────────────────────
interface VideoData {
  id: string;
  job_id: string;
  template_id: string;
  template_name: string;
  template_thumbnail: string;
  template_duration: string;
  template_credits: number;
  status: "processing" | "completed" | "failed";
  video_url: string;
  user_image_url: string;
  created_at: string;
  expires_at?: string;
}

// ── Countdown hook ────────────────────────────────────
function useCountdown(expiresAt: string | undefined): string {
  const getTimeLeft = useCallback(() => {
    if (!expiresAt) return "";
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "00:00:00";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return [hours, minutes, seconds]
      .map((n) => n.toString().padStart(2, "0"))
      .join(":");
  }, [expiresAt]);

  const [display, setDisplay] = useState(getTimeLeft());

  useEffect(() => {
    if (!expiresAt) return;
    setDisplay(getTimeLeft());
    const interval = setInterval(() => {
      setDisplay(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, getTimeLeft]);

  return display;
}

// ── Processing card ─────────────────────────────────
function ProcessingCard({ video }: { video: VideoData }) {
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0A0B14] border border-[#1E2130] group">
      {/* User image, dimmed */}
      <img
        src={video.user_image_url || video.template_thumbnail}
        alt=""
        className="absolute inset-0 w-full h-full object-cover brightness-[0.35]"
      />

      {/* Dark gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Spinner + text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/90 text-sm font-semibold text-center drop-shadow-lg">
          Your video is being created
        </p>
        <p className="text-white/50 text-xs text-center drop-shadow">
          Please wait 2–5 minutes
        </p>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-md">
          {video.template_duration}
        </span>
        <span className="bg-[#F97316]/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
          Processing
        </span>
      </div>
    </div>
  );
}

// ── Completed card ──────────────────────────────────
function CompletedCard({
  video,
  onSelect,
}: {
  video: VideoData;
  onSelect: (v: VideoData) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);
  const expiresDisplay = useCountdown(video.expires_at);

  // Play/pause based on hover
  useEffect(() => {
    if (!videoRef.current) return;
    if (hovering) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [hovering]);

  return (
    <div
      className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0A0B14] border border-[#1E2130] group cursor-pointer"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => onSelect(video)}
    >
      {/* Video element — always rendered, plays on hover */}
      <video
        ref={videoRef}
        src={video.video_url}
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Thumbnail overlay — shown when not hovering */}
      {!hovering && (
        <img
          src={video.user_image_url || video.template_thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Play icon hint on thumbnail */}
      {!hovering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#F97316]/90 flex items-center justify-center transition-transform hover:scale-110 shadow-lg">
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-md">
          {video.template_duration}
        </span>
        <span className="bg-emerald-500/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
          Ready
        </span>
      </div>

      {/* Expires countdown — top-right corner */}
      {expiresDisplay && (
        <div className="absolute top-2 right-2 bg-black/70 text-white/70 text-[10px] px-2 py-0.5 rounded-md">
          {expiresDisplay}
        </div>
      )}
    </div>
  );
}

// ── Video popup modal ───────────────────────────────
function VideoPopup({
  video,
  onClose,
  onDelete,
  accessToken,
}: {
  video: VideoData;
  onClose: () => void;
  onDelete: (jobId: string) => void;
  accessToken: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const expiresDisplay = useCountdown(video.expires_at);

  // Start playing on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/videos/${video.job_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        onDelete(video.job_id);
        onClose();
      }
    } catch {
      // Silently fail
    }
    setDeleting(false);
  }, [video.job_id, deleting, onDelete, onClose]);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = video.video_url;
    a.download = `${video.template_name || "video"}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [video.video_url, video.template_name]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-[#0A0B14] rounded-2xl overflow-hidden border border-[#1E2130]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        <div className="relative w-full" style={{ aspectRatio: "3/4", maxHeight: "70vh" }}>
          <video
            ref={videoRef}
            src={video.video_url}
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />

          {/* Pause overlay indicator */}
          {!playing && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-16 h-16 rounded-full bg-[#F97316]/90 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* Expires countdown overlay — top-right */}
          {expiresDisplay && (
            <div className="absolute top-3 right-3 bg-black/70 text-white/70 text-xs px-2.5 py-1 rounded-lg">
              Expires in {expiresDisplay}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#1E2130]">
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-xs">{video.template_name || "Video"}</span>
            <span className="text-white/30 text-xs">|</span>
            <span className="text-white/40 text-xs">{video.template_duration}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gallery page ─────────────────────────────────────
export default function GalleryPage() {
  const { user, session, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

  // Fetch videos from Supabase
  const fetchVideos = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/videos", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos ?? []);
      }
    } catch {
      // Silently fail — will retry on next poll
    }
  }, [session]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    fetchVideos();
  }, [user, fetchVideos]);

  // Poll for status changes every 5 seconds
  useEffect(() => {
    if (!user || !session?.access_token) return;

    const poll = async () => {
      // Fetch current videos from API
      const res = await fetch("/api/videos", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const currentVideos: VideoData[] = data.videos ?? [];
      setVideos(currentVideos);

      // Check API status for each processing video
      const processing = currentVideos.filter((v) => v.status === "processing");
      if (processing.length === 0) return;

      await Promise.allSettled(
        processing.map(async (video) => {
          if (!video.job_id) return;
          try {
            const genRes = await fetch(`/api/generate/${video.job_id}`);
            const genData = await genRes.json();
            if (genData.status === "completed" || genData.status === "failed") {
              // Update via API — PATCH /api/videos/[jobId]
              await fetch(`/api/videos/${video.job_id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  status: genData.status,
                  videoUrl: genData.videoUrl || "",
                }),
              });
            }
          } catch {
            // Network error — will retry next interval
          }
        })
      );

      // Refresh list after updates
      const refreshRes = await fetch("/api/videos", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setVideos(refreshData.videos ?? []);
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [user, session]);

  const handleDeleteVideo = useCallback((jobId: string) => {
    setVideos((prev) => prev.filter((v) => v.job_id !== jobId));
  }, []);

  // Enquanto carrega, mostra placeholder neutro
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="text-[#F97316]">Gallery</span>
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-white/30">
            <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Não logado
  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="text-[#F97316]">Gallery</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Your personal video gallery
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-24 text-white/50">
            <svg className="w-20 h-20 mb-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xl font-semibold text-white/70 mb-2">Sign in to view your gallery</p>
            <p className="text-sm mb-6">Log in to see all the videos you&apos;ve created</p>
            <button
              onClick={() => setLoginOpen(true)}
              className="bg-[#F97316] hover:bg-[#e66d00] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  // Logado — sem vídeos
  if (videos.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="text-[#F97316]">Gallery</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Your personal video gallery
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-24 text-white/50">
            <svg className="w-20 h-20 mb-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-xl font-semibold text-white/70 mb-2">No videos yet</p>
            <p className="text-sm mb-6">Create your first video and it will appear here</p>
            <Link
              href="/"
              className="bg-[#F97316] hover:bg-[#e66d00] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Create a Video
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logado — com vídeos — single grid ordered by creation
  return (
    <div className="min-h-screen">
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="text-[#F97316]">Gallery</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Your personal video gallery
          </p>
        </div>

        {/* Single grid — all videos in creation order (newest first) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((v) =>
            v.status === "processing" ? (
              <ProcessingCard key={v.id} video={v} />
            ) : (
              <CompletedCard key={v.id} video={v} onSelect={setSelectedVideo} />
            )
          )}
        </div>
      </div>

      {/* Video popup */}
      {selectedVideo && session?.access_token && (
        <VideoPopup
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleDeleteVideo}
          accessToken={session.access_token}
        />
      )}
    </div>
  );
}
