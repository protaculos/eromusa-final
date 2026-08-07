"use client";
import React from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/useT';

export default function Footer() {
  const t = useT();

  return (
    <footer className="py-8 border-t border-[#1E2130] text-white/40 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 text-center">
        <p>© {new Date().getFullYear()} EroMusa AI. All rights reserved.</p>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
          <Link href="/support" className="hover:text-white transition-colors">
            {t('footer.support')}
          </Link>
          <Link href="/terms-of-use" className="hover:text-white transition-colors">
            {t('footer.terms')}
          </Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            {t('footer.privacy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
