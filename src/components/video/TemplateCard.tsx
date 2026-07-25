"use client";
import React, { useRef, useState, useEffect } from 'react';

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
}

export default function TemplateCard({ template, isAutoPlay = false, onClick }: TemplateCardProps) {
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
    if (isAutoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {});
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
