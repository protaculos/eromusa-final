"use client";
import React, { useState, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import TemplateCard from '@/components/video/TemplateCard';
import VideoCreateModal from '@/components/video/VideoCreateModal';
import LoginModal from '@/components/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import { allTemplates, type Template } from '@/data/templates';

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
  // Window of exactly 3 consecutive numbers containing currentPage
  const start = Math.max(1, Math.min(currentPage, totalPages - 2));
  const end = start + 2;

  // Se estiver na primeira metade: window + ... + última página
  // Se estiver na última metade: primeira página + ... + window
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
  const { settings } = useSettings();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loginOpen, setLoginOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const totalPages = Math.ceil(allTemplates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTemplates = allTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const desktopPageNumbers = useMemo(() => getDesktopPageNumbers(totalPages), [totalPages]);
  const mobilePageNumbers = useMemo(() => getMobilePageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="min-h-screen">
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Discover <span className="text-[#F97316]">Styles</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Choose a style and upload a photo to generate your AI video
          </p>
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

        {/* Pagination */}
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

          {/* Mobile: 3 numbers + isolated first/last */}
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

          {/* Desktop: all numbers */}
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
