"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';

const NAV_ITEMS = [
  { href: '/', label: 'Discovery' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/pricing', label: 'Pricing' },
];

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export default function Navbar() {
  const { user, credits, loading } = useAuth();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();

  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Fecha o menu principal ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      setMenuOpen(false);
    } catch (err) {
      alert('Error deleting account. Please contact support.');
    }
  };

  const handleLanguageSelect = (code: string) => {
    // TODO: implement language switching
    setLangOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0A0B14]/80 backdrop-blur-xl border-b border-[#1E2130]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F97316] to-[#ea580c] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              Ero<span className="text-[#F97316]">Musa</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F97316]/10 text-[#F97316]'
                      : 'text-white/60 hover:text-white hover:bg-[#161827]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Credits */}
            {user && (
              <button
                onClick={() => setPaymentOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161827] border border-[#1E2130] text-sm font-semibold text-white/80 hover:text-white hover:border-[#F97316]/50 transition-all"
              >
                <svg className="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                {loading ? '...' : credits ?? 0}
              </button>
            )}

            {/* Settings / Tools icon */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => { setMenuOpen(!menuOpen); setLangOpen(false); }}
                className="w-9 h-9 rounded-full bg-[#161827] border border-[#1E2130] flex items-center justify-center text-white/60 hover:text-white hover:border-[#F97316]/50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-[#0A0B14] border border-[#1E2130] rounded-2xl shadow-2xl overflow-hidden">
                  {/* Logado: email */}
                  {user && (
                    <>
                      <div className="px-4 py-3 text-sm text-white/50 truncate border-b border-[#1E2130]">
                        {user.email}
                      </div>
                      <div className="border-b border-[#1E2130]" />
                    </>
                  )}

                  {/* Credits / Upgrade */}
                  <button
                    onClick={() => { setPaymentOpen(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-[#161827] transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    {user ? 'Credits / Upgrade' : 'Credits / Upgrade'}
                  </button>

                  <div className="border-b border-[#1E2130]" />

                  {/* Idioma */}
                  <div className="relative">
                    <button
                      onClick={() => setLangOpen(!langOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-[#161827] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Idioma
                      </div>
                      <svg className={`w-4 h-4 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Sub-dropdown idiomas */}
                    {langOpen && (
                      <div className="border-t border-[#1E2130] bg-[#0A0B14]">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className="w-full text-left px-4 py-2.5 pl-12 text-sm text-white/60 hover:text-white hover:bg-[#161827] transition-colors"
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Suporte */}
                  <button
                    onClick={() => { setMenuOpen(false); /* TODO: open support */ }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-[#161827] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Suporte
                  </button>

                  {/* Auto play */}
                  <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Auto play
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-9 h-5 bg-[#1E2130] rounded-full peer peer-checked:bg-[#F97316] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>

                  <div className="border-b border-[#1E2130]" />

                  {user ? (
                    <>
                      {/* Sair */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-[#161827] transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sair da conta
                      </button>

                      <div className="border-b border-[#1E2130]" />

                      {/* Excluir conta */}
                      <button
                        onClick={handleDeleteAccount}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-[#161827] transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir conta
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Entrar na conta */}
                      <button
                        onClick={() => { setMenuOpen(false); /* TODO: open login modal */ }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-[#161827] transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Entrar na conta
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </nav>
  );
}
