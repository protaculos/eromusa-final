'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Template } from '@/data/templates';
import TemplateCard from '@/components/video/TemplateCard';

interface CarouselSectionProps {
  title: string;
  templates: Template[];
  isAutoPlay?: boolean;
  onTemplateClick: (template: Template) => void;
}

export default function CarouselSection({
  title,
  templates,
  isAutoPlay = false,
  onTemplateClick,
}: CarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    // Check initial state
    updateScrollButtons();
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by 1 card: card width + gap
    const firstCard = el.querySelector('div') as HTMLElement | null;
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth + 16; // 16 = gap-4
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              canScrollLeft
                ? 'bg-white/10 text-white hover:bg-white/20'
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
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              canScrollRight
                ? 'bg-white/10 text-white hover:bg-white/20'
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

      {/* Carousel track */}
      <div className="relative">
        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {templates.map((template) => (
            <div key={template.id} className="shrink-0 w-[130px] sm:w-[200px]">
              <TemplateCard
                template={template}
                isAutoPlay={isAutoPlay}
                onClick={() => onTemplateClick(template)}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
