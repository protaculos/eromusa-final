"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  created_at: string;
}

// ── Processing card ─────────────────────────────────
function ProcessingCard({ video }: { video: VideoData }) {
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0A0B14] border border-[#1E2130] group">
      {/* Template thumbnail, dimmed */}
      <img
        src={video.template_thumbnail}
        alt=""
        className="absolute inset-0 w-full h-full object-cover brightness-50"
      />

      {/* Spinner + text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/80 text-sm font-semibold text-center">
          Your video is being created
        </p>
        <p className="text-white/40 text-xs text-center">
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
function CompletedCard({ video }: { video: VideoData }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  }, [playing]);

  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0A0B14] border border-[#1E2130] group cursor-pointer">
      {/* Video element — hidden until play */}
      <video
        ref={videoRef}
        src={video.video_url}
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Thumbnail overlay — shown when paused */}
      {!playing && (
        <>
          <img
            src={video.template_thumbnail}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Play button */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            onClick={togglePlay}
          >
            <div className="w-14 h-14 rounded-full bg-[#F97316]/90 flex items-center justify-center transition-transform hover:scale-110">
              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </>
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
    </div>
  );
}

// ── Gallery page ─────────────────────────────────────
export default function GalleryPage() {
  const { user, session, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);

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
              // Update via API
              await fetch("/api/videos", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  jobId: video.job_id,
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

  // Logado — com vídeos
  const processingVideos = videos.filter((v) => v.status === "processing");
  const completedVideos = videos.filter((v) => v.status === "completed");

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

        {/* Processing section */}
        {processingVideos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-4">
              Processing ({processingVideos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {processingVideos.map((v) => (
                <ProcessingCard key={v.id} video={v} />
              ))}
            </div>
          </section>
        )}

        {/* Completed section */}
        {completedVideos.length > 0 && (
          <section>
            <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-4">
              Ready ({completedVideos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {completedVideos.map((v) => (
                <CompletedCard key={v.id} video={v} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
