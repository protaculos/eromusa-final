"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '@/context/AuthContext';

// ── Types ──────────────────────────────────────────
export interface VideoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenPayment?: () => void;
  onVideoCreated?: (jobId: string) => void;
  template: {
    id: string;
    name: string;
    duration: string;
    credits: number;
    videoUrl: string;
    thumbnailUrl: string;
    instructions: string[];
    gradient: string;
    styleId: string;
  };
}

type Step = 'upload' | 'crop' | 'preview';

// ── Helpers ────────────────────────────────────────
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): PixelCrop {
  const percentCrop = centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
  return {
    unit: 'px',
    x: (percentCrop.x / 100) * mediaWidth,
    y: (percentCrop.y / 100) * mediaHeight,
    width: (percentCrop.width / 100) * mediaWidth,
    height: (percentCrop.height / 100) * mediaHeight,
  };
}

function canvasPreview(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('No 2d context'));

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'));
        resolve(blob);
      },
      'image/jpeg',
      0.95,
    );
  });
}

// ── Component ──────────────────────────────────────
export default function VideoCreateModal({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenPayment,
  onVideoCreated,
  template,
}: VideoCreateModalProps) {
  const { user, credits } = useAuth();

  // State
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [crop, setCrop] = useState<PixelCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setSelectedFile(null);
      setPreviewUrl(null);
      setCroppedBlob(null);
      setCrop(undefined);
      setCompletedCrop(null);
      setIsProcessing(false);
      setIsCreating(false);
      setError(null);
      setJobId(null);
      setDragOver(false);
    }
  }, [isOpen]);

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

  // ── Crop handlers ────────────────────────────────
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const centerd = centerAspectCrop(width, height, 1);
    setCrop(centerd);
    setCompletedCrop(centerd);
  };

  const onCropChange = (c: PixelCrop) => {
    setCrop(c);
  };

  const onCropComplete = (c: PixelCrop) => {
    setCompletedCrop(c);
  };

  const applyCrop = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);
    try {
      const blob = await canvasPreview(imgRef.current, completedCrop);
      setCroppedBlob(blob);
      setStep('preview');
    } catch (err) {
      setError('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Create handler ─────────────────────────────
  const handleCreate = async () => {
    if (!user) {
      onOpenLogin();
      return;
    }

    if ((credits ?? 0) < (template?.credits ?? 0)) {
      if (onOpenPayment) {
        onOpenPayment();
      } else {
        alert("Insufficient credits. Please purchase more.");
      }
      return;
    }

    setIsCreating(true);
    setError(null);

    // Simulate creation delay
    await new Promise((r) => setTimeout(r, 2000));

    const fakeJobId = `job_${Date.now()}`;
    setJobId(fakeJobId);
    setIsCreating(false);
    onVideoCreated?.(fakeJobId);
  };

  // ── Render helpers ─────────────────────────────
  const renderUpload = () => (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center
          h-36 sm:h-48 rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${dragOver
            ? 'border-[#F97316] bg-[#F97316]/10'
            : previewUrl
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-[#1E2130] bg-[#0A0B14] hover:border-[#F97316]/50'
          }
        `}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Selected"
              className="absolute inset-0 w-full h-full object-contain rounded-2xl"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
              <span className="bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                Image Selected
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Drop an image here or click to browse</p>
            <p className="text-xs text-white/20">JPEG or PNG</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={onFileSelect}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onClose} className="w-full sm:w-auto flex-1 bg-[#161827] border border-[#1E2130] hover:bg-[#1E2130] text-white/70 rounded-xl px-6 py-3 transition-colors font-semibold">
          Cancel
        </button>
        <button
          onClick={() => setStep('crop')}
          disabled={!selectedFile}
          className="w-full sm:w-auto flex-1 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderCrop = () => (
    <div className="space-y-6">
      {/* Crop area */}
      <div className="flex items-center justify-center bg-[#0A0B14] rounded-2xl overflow-hidden max-h-[60vh]">
        {previewUrl && (
          <ReactCrop
            crop={crop}
            onChange={onCropChange}
            onComplete={onCropComplete}
            aspect={1}
            minWidth={100}
            minHeight={100}
            className="max-h-[60vh]"
          >
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[60vh] w-auto object-contain"
            />
          </ReactCrop>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-white/40 text-center">
        Drag the corners to crop your image to a square
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setStep('upload')}
          className="w-full sm:w-auto flex-1 bg-[#161827] border border-[#1E2130] hover:bg-[#1E2130] text-white/70 rounded-xl px-6 py-3 transition-colors font-semibold"
        >
          Back
        </button>
        <button
          onClick={applyCrop}
          disabled={isProcessing || !completedCrop}
          className="w-full sm:w-auto flex-1 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            'Apply Crop'
          )}
        </button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      {/* Preview + Info grid */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnail */}
        <div className="w-full sm:w-48 shrink-0">
          <div className="aspect-square rounded-xl overflow-hidden bg-[#0A0B14] border border-[#1E2130]">
            <img
              src={template.thumbnailUrl}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-bold text-white">{template.name}</h3>

          <div className="flex flex-wrap gap-2">
            <span className="bg-[#161827] border border-[#1E2130] text-white/60 text-xs px-3 py-1 rounded-full">
              {template.duration}
            </span>
            <span className="bg-[#161827] border border-[#1E2130] text-[#F97316] text-xs px-3 py-1 rounded-full font-semibold">
              {template.credits} credits
            </span>
          </div>

          {/* Instructions */}
          {template.instructions.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Instructions</p>
              <ul className="space-y-1">
                {template.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-white/60">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Cropped image preview */}
      {croppedBlob && (
        <div>
          <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Your Photo</p>
          <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#1E2130]">
            <img
              src={URL.createObjectURL(croppedBlob)}
              alt="Cropped"
              className="w-full h-full object-cover"
            />
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => { setStep('upload'); setCroppedBlob(null); setJobId(null); }}
          className="w-full sm:w-auto flex-1 bg-[#161827] border border-[#1E2130] hover:bg-[#1E2130] text-white/70 rounded-xl px-6 py-3 transition-colors font-semibold"
        >
          Start Over
        </button>

        {user ? (
          <button
            onClick={handleCreate}
            disabled={isCreating || !!jobId}
            className="w-full sm:w-auto flex-1 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
            className="w-full sm:w-auto flex-1 bg-[#F97316] hover:bg-orange-600 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
          >
            Sign in to Create
          </button>
        )}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────
  if (!isOpen) return null;

  const stepTitles: Record<Step, string> = {
    upload: 'Upload Photo',
    crop: 'Crop Image',
    preview: 'Create Video',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Container */}
      <div className="relative bg-[#0A0B14] border border-[#1E2130] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-[#1E2130] scrollbar-track-transparent">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0B14] z-10 flex items-center justify-between p-6 border-b border-[#1E2130]">
          <div>
            <h2 className="text-xl font-bold text-white">{stepTitles[step]}</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Style: <span className="text-[#F97316]">{template.name}</span>
            </p>
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

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2">
          {(['upload', 'crop', 'preview'] as const).map((s, i) => {
            const stepIndex = ['upload', 'crop', 'preview'].indexOf(step);
            const isActive = i <= stepIndex;
            return (
              <React.Fragment key={s}>
                {i > 0 && (
                  <div className={`h-px flex-1 ${isActive ? 'bg-[#F97316]' : 'bg-[#1E2130]'}`} />
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-[#F97316] text-white'
                      : 'bg-[#161827] text-white/30 border border-[#1E2130]'
                  }`}
                >
                  {i + 1}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'upload' && renderUpload()}
          {step === 'crop' && renderCrop()}
          {step === 'preview' && renderPreview()}
        </div>
      </div>
    </div>
  );
}
