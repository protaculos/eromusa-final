import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-8 border-t border-[#1E2130] text-white/40 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} EroMusa AI. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/support" className="hover:text-white transition-colors">
            Support
          </Link>
          <Link href="/terms-of-use" className="hover:text-white transition-colors">
            Terms of Use
          </Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
