"use client";
import React, { useRef, useState, useEffect } from 'react';
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
}

export default function TemplateCard({ template, isAutoPlay = false, onClick, onEdit }: TemplateCardProps) {
  const { isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Seek to very first frame once video metadata is loaded
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onMeta = () => {
      el.currentTime = 0;
      setLoaded(true);
    };
    el.addEventListener('loadedmetadata', onMeta);
    return () => el.removeEventListener('loadedmetadata', onMeta);
  }, []);

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
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl overflow-hidden bg-[#161827] border border-[#1E2130] hover:border-[#EE5F96]/50 transition-all duration-300 text-left w-full focus:outline-none focus:ring-2 focus:ring-[#EE5F96]/50"
    >
      <div className="relative aspect-[9/16] overflow-hidden">
        {/* Video serves as both thumbnail and hover preview */}
        <video
          ref={videoRef}
          src={template.videoUrl}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          muted
          loop
          playsInline
          preload="metadata"
          poster=""
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Admin gear icon — top right */}
        {isAdmin && (
          <div
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#EE5F96] transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}

        {/* Duration badge — bottom right */}
        <div className="absolute bottom-2 right-2">
          <span className="bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-md">
            {template.duration}
          </span>
        </div>

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
