"use client";
import React, { useState, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import TemplateCard from '@/components/video/TemplateCard';
import VideoCreateModal from '@/components/video/VideoCreateModal';
import LoginModal from '@/components/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import { allTemplates, type Template } from '@/data/templates';

// ============================================
// Filter categories
// ============================================
const FILTER_CATEGORIES = [
  { label: "Blowjob", tags: ["blowjob", "deepthroat", "facefuck", "sucking"] },
  { label: "Anal", tags: ["anal", "hole", "ass"] },
  { label: "Positions", tags: ["missionary", "doggy", "cowgirl", "sideways", "spoon", "nelson", "standing", "prone"] },
  { label: "Sex", tags: ["sex", "fuck", "ride", "riding"] },
  { label: "Cum", tags: ["cum", "cumshot", "facial", "facials", "creampie"] },
  { label: "Foot", tags: ["footjob", "feet", "shoejob"] },
  { label: "Handjob", tags: ["handjob", "jerking"] },
  { label: "POV", tags: ["pov"] },
  { label: "Pussy", tags: ["pussy", "rubbing", "play"] },
  { label: "Tits", tags: ["titfuck", "tits", "boobs"] },
  { label: "Pregnant", tags: ["pregnant", "lactation"] },
  { label: "BBC", tags: ["bbc", "black"] },
  { label: "69", tags: ["69"] },
  { label: "Kissing", tags: ["kissing", "spitting"] },
  { label: "Squirt", tags: ["squirting"] },
  { label: "Toys", tags: ["dildo", "vibrator"] },
  { label: "Solo", tags: ["posing", "naked", "hiding", "herself", "pleasuring", "show", "jack"] },
  { label: "Other", tags: ["ahegao", "airblow", "regret", "wood", "choke", "gear", "shift", "roast", "spit", "walk", "massage", "tip", "enjoyment", "undress", "undressing", "upskirt", "arch", "twerking", "freeze", "energetic", "forced", "restrain", "rough", "carry", "shy", "anime", "legs", "lied", "down", "eyes", "morning", "pay", "both", "hands", "xxl", "close", "cock", "face", "glory", "hole", "spread", "sitting", "double", "edging", "angled", "threesome", "soapy", "just", "hard"] },
];

// ============================================
// Pagination
// ============================================
const ITEMS_PER_PAGE = 12;

function getDesktopPageNumbers(totalPages: number): number[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

function getMobilePageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  const start = Math.max(1, Math.min(currentPage, totalPages - 2));
  const end = start + 2;

  if (currentPage <= totalPages - 3) {
    for (let i = start; i <= end; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  } else {
    pages.push(1);
    pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
  }
  return pages;
}

// ============================================
// Discover Page
// ============================================
export default function DiscoverPage() {
  const { settings, updateSettings } = useSettings();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loginOpen, setLoginOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let result = allTemplates;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q))
      );
    }

    // Category filters
    if (activeFilters.size > 0) {
      result = result.filter(t =>
        t.tags.some(tag => activeFilters.has(tag))
      );
    }

    return result;
  }, [searchQuery, activeFilters]);

  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTemplates = filteredTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const desktopPageNumbers = useMemo(() => getDesktopPageNumbers(totalPages), [totalPages]);
  const mobilePageNumbers = useMemo(() => getMobilePageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const toggleFilter = (tags: string[]) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      // If all tags in this category are already active, remove them all
      const allActive = tags.every(t => next.has(t));
      if (allActive) {
        tags.forEach(t => next.delete(t));
      } else {
        tags.forEach(t => next.add(t));
      }
      return next;
    });
    setCurrentPage(1);
  };

  const isFilterActive = (tags: string[]) => tags.every(t => activeFilters.has(t));

  return (
    <div className="min-h-screen">
      <div className="pt-6 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Row 1: Autoplay, Favorites, Search */}
        <div className="flex items-center gap-3 mb-4">
          {/* Autoplay toggle */}
          <button
            onClick={() => updateSettings({ autoPlayVideos: !settings.autoPlayVideos })}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              settings.autoPlayVideos
                ? "bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40"
                : "bg-[#161827] text-white/60 border border-[#1E2130] hover:text-white hover:border-[#F97316]/50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Autoplay
          </button>

          {/* Favorites */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              favoritesOnly
                ? "bg-pink-500/20 text-pink-400 border border-pink-500/40"
                : "bg-[#161827] text-white/60 border border-[#1E2130] hover:text-white hover:border-[#F97316]/50"
            }`}
          >
            <svg className="w-4 h-4" fill={favoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favorites
          </button>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md ml-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search styles..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#161827] border border-[#1E2130] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#F97316]/50 transition-colors placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Row 2: Filter categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => toggleFilter(cat.tags)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isFilterActive(cat.tags)
                  ? "bg-[#F97316] text-white"
                  : "bg-[#161827] text-white/50 border border-[#1E2130] hover:text-white hover:border-[#F97316]/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {currentTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isAutoPlay={settings.autoPlayVideos}
              onClick={() => setSelectedTemplate(template)}
            />
          ))}
        </div>

        {/* Empty state */}
        {currentTemplates.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">No styles found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#161827] border border-[#1E2130] text-white/60 hover:text-white hover:border-[#F97316]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2 md:hidden">
              {mobilePageNumbers.map((page, i) =>
                page === "..." ? (
                  <span key={`m-ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-white/30 text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={`m-${page}`}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                      currentPage === page
                        ? "bg-[#F97316] text-white"
                        : "bg-[#161827] border border-[#1E2130] text-white/60 hover:text-white hover:border-[#F97316]/50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">
              {desktopPageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-12 h-12 rounded-xl font-semibold text-sm transition-all ${
                    currentPage === page
                      ? "bg-[#F97316] text-white"
                      : "bg-[#161827] border border-[#1E2130] text-white/60 hover:text-white hover:border-[#F97316]/50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#161827] border border-[#1E2130] text-white/60 hover:text-white hover:border-[#F97316]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <VideoCreateModal
        isOpen={!!selectedTemplate}
        template={selectedTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.title,
          duration: selectedTemplate.duration,
          credits: selectedTemplate.credits,
          videoUrl: selectedTemplate.videoUrl,
          thumbnailUrl: selectedTemplate.thumbnail,
          instructions: selectedTemplate.instructions,
          gradient: selectedTemplate.gradient,
          styleId: selectedTemplate.styleId,
        } : {
          id: '',
          name: '',
          duration: '',
          credits: 0,
          videoUrl: '',
          thumbnailUrl: '',
          instructions: [],
          gradient: '',
          styleId: '',
        }}
        onClose={() => setSelectedTemplate(null)}
        onOpenLogin={() => { setSelectedTemplate(null); setLoginOpen(true); }}
        onOpenPayment={() => { setSelectedTemplate(null); setPaymentOpen(true); }}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </div>
  );
}
