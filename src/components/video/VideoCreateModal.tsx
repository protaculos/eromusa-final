"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// ── Types ──────────────────────────────────────────
export interface VideoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenPayment?: () => void;
  categoryTemplates?: {
    id: string;
    title: string;
    thumbnail: string;
    videoUrl: string;
    gradient: string;
    duration: string;
    credits: number;
    instructions: string[];
    tags: string[];
    styleId: string;
  }[];
  template: {
    id: string;
    name: string;
    duration: string;
    credits: number;
    videoUrl: string;
    thumbnailUrl: string;
    instructions: string[];
    tags: string[];
    gradient: string;
    styleId: string;
  };
}

// ── Component ──────────────────────────────────────
export default function VideoCreateModal({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenPayment,
  categoryTemplates = [],
  template,
}: VideoCreateModalProps) {
  const { user, session, credits } = useAuth();
  const router = useRouter();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(template);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageBlob(null);
      setIsCreating(false);
      setError(null);
      setJobId(null);
      setDragOver(false);
      setActiveTemplate(template);
    }
  }, [isOpen]);

  // Sync activeTemplate when template prop changes (e.g. user clicks a different scene)
  useEffect(() => {
    if (isOpen) {
      setActiveTemplate(template);
    }
  }, [template, isOpen]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── File handlers ──────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG or PNG)');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageBlob(file);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // ── Create handler ─────────────────────────────
  const handleCreate = async () => {
    if (!user) {
      onOpenLogin();
      return;
    }

    if ((credits ?? 0) < (activeTemplate?.credits ?? 0)) {
      if (onOpenPayment) {
        onOpenPayment();
      } else {
        alert("Insufficient credits. Please purchase more.");
      }
      return;
    }

    setIsCreating(true);
    setError(null);

    // Validate before sending
    if (!imageBlob) {
      setError("Please select an image first");
      setIsCreating(false);
      return;
    }

    if (!activeTemplate?.styleId) {
      setError("Invalid template: missing style ID");
      setIsCreating(false);
      return;
    }

    // Convert image blob to base64 data URL
    let imageBase64 = "";
    if (imageBlob) {
      imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageBlob);
      });
    }

    try {
      // Debug: log what we're sending
      console.log("[VideoCreateModal] Sending to /api/generate:", {
        hasImage: !!imageBase64,
        imageBase64Length: imageBase64.length,
        styleId: template.styleId,
        templateId: template.id,
      });

      // Call our server-side API route
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          styleId: activeTemplate.styleId,
          templateId: activeTemplate.id,
          templateName: activeTemplate.name,
          templateThumbnail: activeTemplate.thumbnailUrl,
          templateDuration: activeTemplate.duration,
          templateCredits: activeTemplate.credits,
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid JSON response from server" };
      }

      console.log("[VideoCreateModal] Response:", res.status, data);

      if (!res.ok) {
        throw new Error(data.error || data.detail || `HTTP ${res.status}: Generation failed`);
      }

      // Persist to Supabase — status: processing
      const token = session?.access_token;
      if (token) {
        const persistRes = await fetch("/api/videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobId: data.jobId,
            templateId: data.templateId,
            templateName: data.templateName,
            templateThumbnail: data.templateThumbnail,
            templateDuration: data.templateDuration,
            templateCredits: data.templateCredits,
            userImageUrl: data.userImageUrl || "",
          }),
        });
        if (!persistRes.ok) {
          const persistErr = await persistRes.json().catch(() => ({}));
          console.error("[VideoCreateModal] Failed to persist video:", persistErr);
          throw new Error(persistErr.error || "Failed to save video to database");
        }
      }

      // Polling is handled by the Gallery page
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create video");
      setIsCreating(false);
      return;
    }

    // Close modal and redirect to gallery
    onClose();
    router.push("/gallery");
  };

  // ── Render ─────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Container — portrait/mobile-like, fixed aspect, responsive */}
      <div className="relative bg-[#0A0B14] border border-[#1E2130] rounded-2xl w-full max-w-[420px] shadow-2xl">
        {/* Header with title + filters */}
        <div className="sticky top-0 bg-[#0A0B14] z-10 flex items-center justify-between p-5 border-b border-[#1E2130]">
          <div className="min-w-0">
            <h2
              className="font-bold text-white whitespace-nowrap"
              style={{ fontSize: activeTemplate.name.length > 30 ? '0.9rem' : activeTemplate.name.length > 20 ? '1.05rem' : '1.125rem' }}
            >{activeTemplate.name}</h2>
            {activeTemplate.tags.length > 0 && (
              <p
                className="text-white/40 mt-0.5 whitespace-nowrap"
                style={{ fontSize: activeTemplate.tags.join(', ').length > 50 ? '0.65rem' : '0.75rem' }}
              >
                Filters: <span className="text-[#EE5F96]">{activeTemplate.tags.join(', ')}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Side-by-side cards: Upload (left) + Template preview (right) */}
          <div className="flex gap-3">
            {/* Upload card — aspect-[3/4] portrait */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Your Image</p>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative aspect-[2/3] rounded-2xl border-2 border-dashed cursor-pointer
                  transition-all duration-200 overflow-hidden
                  ${dragOver
                    ? 'border-[#EE5F96] bg-[#EE5F96]/10'
                    : previewUrl
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-[#1E2130] bg-[#0A0B14] hover:border-[#EE5F96]/50'
                  }
                `}
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Selected"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        Image Selected
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Template thumbnail (first frame, paused) as dimmed background reference */}
                    <video
                      src={activeTemplate.videoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                      onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0; }}
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40 p-4 text-center z-10">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">Upload your photo</p>
                      <p className="text-[10px] text-white/20">JPEG or PNG</p>
                    </div>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={onFileSelect}
                />
              </div>
            </div>

            {/* Template preview card — aspect-[3/4] portrait */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Output Video</p>
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0A0B14] border border-[#1E2130] group">
                <video
                  src={activeTemplate.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Bottom badges */}
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                  <p className="text-white text-xs font-semibold truncate">{activeTemplate.name}</p>
                  <span className="bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-md shrink-0 ml-2">
                    {activeTemplate.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category scenes carousel — thumbnails only */}
          {categoryTemplates.length > 1 && (
            <div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">More Examples</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {categoryTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTemplate({
                        id: t.id,
                        name: t.title,
                        duration: t.duration,
                        credits: t.credits,
                        videoUrl: t.videoUrl,
                        thumbnailUrl: t.thumbnail,
                        instructions: t.instructions,
                        tags: t.tags,
                        gradient: t.gradient,
                        styleId: t.styleId,
                      });
                    }}
                    className={`shrink-0 w-16 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      activeTemplate.id === t.id
                        ? 'border-[#EE5F96] ring-1 ring-[#EE5F96]/50'
                        : 'border-[#1E2130] hover:border-white/30'
                    }`}
                  >
                    <video
                      src={t.videoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                      onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0; }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Success message */}
          {jobId && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Video created! Job ID: {jobId}
            </div>
          )}

          {/* Bottom bar: Credits + Create button centered */}
          <div className="flex items-center justify-center gap-4 pt-1">
            {user && (
              <div className="flex items-center gap-1.5">
                <span className="text-white/40 text-sm font-medium">✦</span>
                <span className="text-white font-bold text-base">{activeTemplate.credits}</span>
                <span className="text-white/40 text-sm">Credits</span>
              </div>
            )}

            {user ? (
              <button
                onClick={handleCreate}
                disabled={isCreating || !!jobId || !imageBlob}
                className="bg-[#EE5F96] hover:bg-pink-600 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 transition-colors flex items-center gap-2 text-sm"
              >
                {isCreating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : jobId ? (
                  'Created ✓'
                ) : (
                  'Create Video'
                )}
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-[#EE5F96] hover:bg-pink-600 text-white font-semibold rounded-xl px-6 py-3 transition-colors text-sm"
              >
                Create Video
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
