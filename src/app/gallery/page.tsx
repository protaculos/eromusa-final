"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import LoginModal from '@/components/LoginModal';

export default function GalleryPage() {
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = React.useState(false);

  // Enquanto carrega, mostra placeholder neutro
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B14]">
        <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="text-[#F97316]">Gallery</span>
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-white/30">
            <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Não logado
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0B14]">
        <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="text-[#F97316]">Gallery</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Your personal video gallery
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-24 text-white/50">
            <svg className="w-20 h-20 mb-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xl font-semibold text-white/70 mb-2">Sign in to view your gallery</p>
            <p className="text-sm mb-6">Log in to see all the videos you&apos;ve created</p>
            <button
              onClick={() => setLoginOpen(true)}
              className="bg-[#F97316] hover:bg-[#e66d00] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  // Logado — por enquanto sem vídeos (placeholder)
  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="text-[#F97316]">Gallery</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Your personal video gallery
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-white/50">
          <svg className="w-20 h-20 mb-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-xl font-semibold text-white/70 mb-2">No videos yet</p>
          <p className="text-sm mb-6">Create your first video and it will appear here</p>
          <Link
            href="/"
            className="bg-[#F97316] hover:bg-[#e66d00] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Create a Video
          </Link>
        </div>
      </div>
    </div>
  );
}
