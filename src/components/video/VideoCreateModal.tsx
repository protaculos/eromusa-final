"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/i18n/useT';
import { useToast } from '@/components/Toast';

// ── Types ──────────────────────────────────────────
export interface VideoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenPayment?: () => void;
  sceneExamples?: {
    id: string;
    scene_id: string;
    video_url: string;
    name: string;
    order: number;
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
  sceneExamples = [],
  template,
}: VideoCreateModalProps) {
  const { user, session, credits } = useAuth();
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(template);
  const [examplesReady, setExamplesReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build a template with the unified list resolved: official video = first item of sceneExamples when available.
  const resolvedTemplate = useMemo(() => {
    if (sceneExamples.length > 0) {
      const official = sceneExamples[0];
      return {
        ...template,
        videoUrl: official.video_url,
        thumbnailUrl: official.video_url,
      };
    }
    return template;
  }, [template, sceneExamples]);

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
      setActiveTemplate(resolvedTemplate);
    } else {
      // Clear immediately on close to prevent ghosting when opening another scene
    }
  }, [isOpen, resolvedTemplate]);

  // Sync activeTemplate when template changes (e.g. user clicks a different scene)
  useEffect(() => {
    if (isOpen) {
      setActiveTemplate(resolvedTemplate);
      setExamplesReady(false);
    }
  }, [resolvedTemplate, isOpen]);

  // Mark examples as ready when they're available
  useEffect(() => {
    if (isOpen) {
      setExamplesReady(sceneExamples.length > 0);
    } else {
      setExamplesReady(false);
    }
  }, [isOpen, sceneExamples]);

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

  // Preload example videos when modal opens so they switch instantly
  useEffect(() => {
    if (!isOpen || sceneExamples.length === 0) return;
    const links: HTMLLinkElement[] = [];
    for (const ex of sceneExamples) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = ex.video_url;
      document.head.appendChild(link);
      links.push(link);
    }
    return () => {
      for (const link of links) {
        document.head.removeChild(link);
      }
    };
  }, [isOpen, sceneExamples]);

  // ── File handlers ──────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      const message = t('videoModal.selectImage');
      setError(message);
      toast(message, 'error');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageBlob(file);
  }, [t, toast]);

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
      const message = t('videoModal.insufficientCredits');
      if (onOpenPayment) {
        onOpenPayment();
      } else {
        setError(message);
        toast(message, 'error');
      }
      return;
    }

    setIsCreating(true);
    setError(null);

    // Validate before sending
    if (!imageBlob) {
      setError(t('videoModal.selectImageFirst'));
      setIsCreating(false);
      return;
    }

    if (!activeTemplate?.styleId) {
      setError(t('videoModal.invalidTemplate'));
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
      toast(t('videoModal.videoCreated'), 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create video';
      setError(message);
      toast(message, 'error');
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

      {/* Container — compact desktop popup */}
      <div className="relative bg-[#0A0B14] border border-[#1E2130] rounded-2xl w-full max-w-[360px] shadow-2xl overflow-hidden md:scale-95">
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
                {t('videoModal.filtersLabel').replace('{tags}', activeTemplate.tags.join(', '))}
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
        <div className="p-5 space-y-4">
          {/* Side-by-side cards: Upload (left) + Template preview (right) */}
          <div className="flex gap-4">
            {/* Upload card */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/70 font-bold uppercase tracking-wider mb-2">{t('videoModal.yourImage')}</p>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer
                  transition-all duration-200 overflow-hidden
                  ${dragOver
                    ? 'border-[#EE5F96] bg-[#EE5F96]/10'
                    : previewUrl
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-[#1E2130] bg-[#161827] hover:border-[#EE5F96]/50'
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
                      <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {t('videoModal.imageSelected')}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <video
                      src={activeTemplate.videoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                      onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0; }}
                    />
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 p-4 text-center z-10">
                      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[11px] font-medium text-white/90">{t('videoModal.uploadPhoto')}</p>
                      <p className="text-[9px] text-white/40">{t('videoModal.jpegOrPng')}</p>
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

            {/* Template preview card */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/70 font-bold uppercase tracking-wider mb-2">{t('videoModal.outputVideo')}</p>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#161827] border border-[#1E2130] group">
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
                  <p className="text-white text-[11px] font-bold truncate">{activeTemplate.name}</p>
                  <span className="bg-black/60 text-white/90 text-[9px] px-1.5 py-0.5 rounded-md shrink-0 ml-2">
                    {activeTemplate.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scene examples carousel — original + examples */}
          <div>
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">{t('videoModal.moreExamples')}</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {/* Original scene video — always first */}
              <button
                key="original"
                onClick={() => {
                  setActiveTemplate({
                    id: template.id,
                    name: template.name,
                    duration: template.duration,
                    credits: template.credits,
                    videoUrl: template.videoUrl,
                    thumbnailUrl: template.thumbnailUrl,
                    instructions: template.instructions,
                    tags: template.tags,
                    gradient: template.gradient,
                    styleId: template.styleId,
                  });
                }}
                className={`relative shrink-0 w-16 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  activeTemplate.videoUrl === template.videoUrl
                    ? 'border-[#EE5F96] ring-1 ring-[#EE5F96]/50'
                    : 'border-[#1E2130] hover:border-white/30'
                }`}
              >
                <video
                  src={template.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0; }}
                />
              </button>

              {/* Database examples */}
              {sceneExamples.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setActiveTemplate({
                      id: ex.scene_id,
                      name: ex.name || activeTemplate.name,
                      duration: activeTemplate.duration,
                      credits: activeTemplate.credits,
                      videoUrl: ex.video_url,
                      thumbnailUrl: ex.video_url,
                      instructions: activeTemplate.instructions,
                      tags: activeTemplate.tags,
                      gradient: activeTemplate.gradient,
                      styleId: activeTemplate.styleId,
                    });
                  }}
                  className={`relative shrink-0 w-16 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    activeTemplate.videoUrl === ex.video_url
                      ? 'border-[#EE5F96] ring-1 ring-[#EE5F96]/50'
                      : 'border-[#1E2130] hover:border-white/30'
                  }`}
                >
                  <video
                    src={ex.video_url}
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
              {t('videoModal.videoCreated')} Job ID: {jobId}
            </div>
          )}

          {/* Bottom bar: {t('videoModal.credits')} + Create button centered */}
          <div className="flex items-center justify-center gap-4 pt-1">
            {user && (
              <div className="flex items-center gap-1.5">
                <span className="text-white/40 text-sm font-medium">✦</span>
                <span className="text-white font-bold text-base">{activeTemplate.credits}</span>
                <span className="text-white/40 text-sm">{t('videoModal.credits')}</span>
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
                    {t('videoModal.creating')}
                  </>
                ) : jobId ? (
                  t('videoModal.created')
                ) : (
                  t('videoModal.createVideo')
                )}
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-[#EE5F96] hover:bg-pink-600 text-white font-semibold rounded-xl px-6 py-3 transition-colors text-sm"
              >
                {t('videoModal.createVideo')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
