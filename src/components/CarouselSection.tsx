'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Template } from '@/data/templates';
import TemplateCard from '@/components/video/TemplateCard';

interface CarouselSectionProps {
  title: string;
  templates: Template[];
  isAutoPlay?: boolean;
  onTemplateClick: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  onAddScene?: () => void;
  onDeleteCategory?: () => void;
  onRenameCategory?: (newName: string) => void;
  onReorderScene?: (sceneId: string, direction: 'up' | 'down') => void;
  onMoveToCategory?: (sceneId: string, toCategoryId: string) => void;
  categoryId?: string;
  categoryIndex?: number;
  totalCategories?: number;
  allCategories?: { id: string; name: string }[];
}

export default function CarouselSection({
  title,
  templates,
  isAutoPlay = false,
  onTemplateClick,
  onEditTemplate,
  onAddScene,
  onDeleteCategory,
  onRenameCategory,
  onReorderScene,
  onMoveToCategory,
  categoryId,
  categoryIndex = 0,
  totalCategories = 0,
  allCategories = [],
}: CarouselSectionProps) {
  const { isAdmin } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
    updateScrollButtons();
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons]);

  useEffect(() => {
    setNewTitle(title);
  }, [title]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector('div') as HTMLElement | null;
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth + 16;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleTitleSubmit = () => {
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== title && onRenameCategory) {
      onRenameCategory(trimmed);
    } else {
      setNewTitle(title);
    }
    setEditingTitle(false);
  };

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') { setNewTitle(title); setEditingTitle(false); }
              }}
              className="bg-[#161827] border border-[#EE5F96] rounded-lg px-3 py-1 text-lg font-semibold text-white focus:outline-none max-w-[250px]"
            />
          ) : (
            <h2
              className="text-lg font-semibold text-white cursor-pointer hover:text-[#EE5F96] transition-colors"
              onDoubleClick={() => isAdmin && setEditingTitle(true)}
              title={isAdmin ? "Double-click to rename" : undefined}
            >
              {title}
            </h2>
          )}
          {/* Admin action buttons: pencil, add, delete */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              {onRenameCategory && (
                <button
                  onClick={() => { setNewTitle(title); setEditingTitle(true); }}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#EE5F96] transition-colors shrink-0"
                  title="Rename category"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              {onAddScene && (
                <button
                  onClick={onAddScene}
                  className="w-7 h-7 rounded-full bg-[#EE5F96]/20 border border-[#EE5F96]/40 flex items-center justify-center hover:bg-[#EE5F96]/40 transition-colors shrink-0"
                  title="Add scene to this category"
                >
                  <svg className="w-4 h-4 text-[#EE5F96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              {onDeleteCategory && (
                <button
                  onClick={onDeleteCategory}
                  className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500/40 transition-colors shrink-0"
                  title="Delete this category"
                >
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
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
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {templates.map((template, index) => (
            <div key={template.id} className="shrink-0 w-[130px] sm:w-[200px] relative group/card">
              {/* 4-directional arrows — admin only, always visible */}
              {isAdmin && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {/* ← Left — reorder up (previous position) */}
                  {onReorderScene && index > 0 && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReorderScene(template.id, 'up'); }}
                      className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-black/90 flex items-center justify-center hover:bg-[#EE5F96] transition-colors shadow-lg border border-white/20"
                      title="Move left (reorder up)"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {/* → Right — reorder down (next position) */}
                  {onReorderScene && index < templates.length - 1 && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReorderScene(template.id, 'down'); }}
                      className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-7 h-7 rounded-full bg-black/90 flex items-center justify-center hover:bg-[#EE5F96] transition-colors shadow-lg border border-white/20"
                      title="Move right (reorder down)"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  {/* ↑ Up — move to previous category, position 1 */}
                  {onMoveToCategory && categoryIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const prevCat = allCategories[categoryIndex - 1];
                        if (prevCat) onMoveToCategory(template.id, prevCat.id);
                      }}
                      className="pointer-events-auto absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/90 flex items-center justify-center hover:bg-emerald-500 transition-colors shadow-lg border border-white/20"
                      title={`Move to "${allCategories[categoryIndex - 1]?.name || 'previous'}" category`}
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {/* ↓ Down — move to next category, position 1 */}
                  {onMoveToCategory && categoryIndex < totalCategories - 1 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const nextCat = allCategories[categoryIndex + 1];
                        if (nextCat) onMoveToCategory(template.id, nextCat.id);
                      }}
                      className="pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-7 h-7 rounded-full bg-black/90 flex items-center justify-center hover:bg-emerald-500 transition-colors shadow-lg border border-white/20"
                      title={`Move to "${allCategories[categoryIndex + 1]?.name || 'next'}" category`}
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <TemplateCard
                template={template}
                isAutoPlay={isAutoPlay}
                onClick={() => onTemplateClick(template)}
                onEdit={onEditTemplate ? () => onEditTemplate(template) : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
