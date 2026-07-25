'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Template } from '@/data/templates';
import TemplateCard from './TemplateCard';

interface CarouselSectionProps {
  title: string;
  templates: Template[];
  isAutoPlay: boolean;
  onTemplateClick: (template: Template) => void;
}

export default function CarouselSection({
  title,
  templates,
  isAutoPlay,
  onTemplateClick,
}: CarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    // Check on mount and resize
    updateScrollButtons();
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      ro.disconnect();
    };
  }, [templates, updateScrollButtons]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    dragScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    scrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  if (templates.length === 0) return null;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">{templates.length} styles</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel track */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        className={`flex gap-4 overflow-x-auto pb-2 scrollbar-hide select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <TemplateCard
              template={template}
              isAutoPlay={isAutoPlay}
              onClick={() => onTemplateClick(template)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
