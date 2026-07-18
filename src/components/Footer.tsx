import React from 'react';

export default function Footer() {
  return (
    <footer className="py-12 border-t border-[#1E2130] text-center text-white/30 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} EroMusa AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
