"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const { user, credits, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0A0B14]/80 backdrop-blur-xl border-b border-[#1E2130]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Ero<span className="text-[#F97316]">Musa</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#161827] border border-[#1E2130] rounded-full px-3 py-1.5">
                  <svg className="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white text-sm font-semibold">{credits ?? 0}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-bold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            ) : (
              <Link
                href="/"
                className="bg-[#F97316] hover:bg-[#e66d00] text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
