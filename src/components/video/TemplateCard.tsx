"use client";
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    thumbnail: string;
    isFree: boolean;
    isPopular: boolean;
    tags: string[];
    videoUrl: string;
    gradient: string;
    duration: string;
    credits: number;
    instructions: string[];
    styleId: string;
  };
  isAutoPlay?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReorderUp?: () => void;
  onReorderDown?: () => void;
  showReorderUp?: boolean;
  showReorderDown?: boolean;
}

export default function TemplateCard({ template, isAutoPlay = false, onClick, onEdit, onDelete, onReorderUp, onReorderDown, showReorderUp, showReorderDown }: TemplateCardProps) {
  const { isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [inView, setInView] = useState(false);

  // Lazy-load: only set the video src once the card is near the viewport.
  // This avoids loading every template video at page load.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const src = useMemo(
    () => (inView ? template.videoUrl : undefined),
    [inView, template.videoUrl]
  );

  // Seek to very first frame once video metadata is loaded
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onMeta = () => {
      el.currentTime = 0;
    };
    el.addEventListener('loadedmetadata', onMeta);
    return () => el.removeEventListener('loadedmetadata', onMeta);
  }, []);

  // Autoplay when visible on screen
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isAutoPlay) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isAutoPlay]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('[TemplateCard] play error:', err);
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      // Se autoplay estiver ligado, não pausa — o vídeo continua rodando sozinho
      if (isAutoPlay) return;
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const ariaLabel = `${template.title}${template.isFree ? ' (Free)' : ''}${template.isPopular ? ' — Popular' : ''}`;

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      className="group relative rounded-2xl overflow-hidden bg-[#161827] border border-[#1E2130] hover:border-[#EE5F96]/50 transition-all duration-300 text-left w-full focus:outline-none focus:ring-2 focus:ring-[#EE5F96]/50"
    >
      <div className="relative overflow-hidden">
        {/* Video serves as both thumbnail and hover preview.
            Only rendered when the card is close to the viewport (lazy-load). */}
        <video
          ref={videoRef}
          src={src}
          className={`w-full h-auto object-contain transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          muted
          loop
          playsInline
          preload={inView ? 'metadata' : 'none'}
          poster=""
        />

        {/* Placeholder until video is lazy-loaded */}
        {!inView && (
          <div className="absolute inset-0 bg-[#1a1c2e] animate-pulse" />
        )}

        {/* Play icon overlay — visible when video is NOT playing (autoplay off + no hover) */}
        {!isAutoPlay && !isHovered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-white/80 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Admin gear icon — top right */}
        {isAdmin && (
          <div
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            role="button"
            aria-label={`Edit ${template.title}`}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-[#EE5F96] transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}

        {/* Admin delete icon — top left */}
        {isAdmin && onDelete && (
          <div
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            role="button"
            aria-label={`Delete ${template.title}`}
            className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        )}

        {/* Admin reorder arrows — inside card, bottom area */}
        {isAdmin && (
          <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center gap-1 pointer-events-none">
            {onReorderUp && showReorderUp && (
              <button
                onClick={(e) => { e.stopPropagation(); onReorderUp(); }}
                aria-label={`Move ${template.title} up`}
                className="pointer-events-auto w-6 h-6 rounded-full bg-black/80 flex items-center justify-center hover:bg-[#EE5F96] transition-colors shadow-lg border border-white/20"
                title="Move up"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {onReorderDown && showReorderDown && (
              <button
                onClick={(e) => { e.stopPropagation(); onReorderDown(); }}
                aria-label={`Move ${template.title} down`}
                className="pointer-events-auto w-6 h-6 rounded-full bg-black/80 flex items-center justify-center hover:bg-[#EE5F96] transition-colors shadow-lg border border-white/20"
                title="Move down"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#EE5F96] transition-colors">
            {template.title}
          </h3>
        </div>
      </div>
    </button>
  );
}
