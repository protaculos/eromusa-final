"use client";
import React, { useRef, useState } from 'react';

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

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isAutoPlay && videoRef.current && template.videoUrl) {
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
      className="group relative rounded-2xl overflow-hidden bg-[#161827] border border-[#1E2130] hover:border-[#F97316]/50 transition-all duration-300 text-left w-full focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={template.thumbnail}
          alt={template.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          loading="lazy"
        />

        {/* Video overlay on hover */}
        {template.videoUrl && (
          <video
            ref={videoRef}
            src={template.videoUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
          />
        )}

        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${template.gradient} opacity-60`} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {template.isFree && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              Free
            </span>
          )}
          {template.isPopular && (
            <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              Popular
            </span>
          )}
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-md">
            {template.duration}
          </span>
        </div>

        {/* Credits badge */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/60 text-[#F97316] text-[10px] font-semibold px-2 py-0.5 rounded-md">
            {template.credits} cr
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#F97316] transition-colors">
          {template.title}
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {template.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-[10px] text-white/30">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
