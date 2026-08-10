"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/useT';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full py-6 flex items-center justify-between text-left text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#EE5F96]/50 rounded-lg"
      >
        <span className="text-lg font-medium">{question}</span>
        <svg
          className={`w-5 h-5 transition-transform shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
        role="region"
      >
        <p className="text-white/50 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

export default function SupportPage() {
  const t = useT();
  return (
    <div className="min-h-screen">
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-[#EE5F96] hover:text-[#d94d7e] text-sm font-semibold transition-colors">
            &larr; {t('support.backToHome')}
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">{t('support.title')}</h1>

        <div className="space-y-8">
          <section className="bg-[#161827] border border-[#1E2130] rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-4">{t('support.contactUs')}</h2>
            <p className="mb-6 text-white/70">
              {t('support.contactDesc')}
            </p>
            <a
              href="https://t.me/suporte_eromusa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#229ED9] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1d8bc0] transition-colors whitespace-nowrap"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.775.085 1.213-.005 1.065-.195 2.087-.572 3.05a16.155 16.155 0 01-2.148 3.476c-.184.228-.398.44-.633.628-.636.51-1.347.78-2.045.78-.456 0-.912-.17-1.268-.5-.26-.242-.526-.667-.804-1.18l-.882-1.628c-.353-.65-.694-1.33-1.02-2.004-.246-.51-.48-1.02-.7-1.52-.17-.38-.31-.76-.31-1.1 0-.44.2-.84.58-1.12.16-.12.35-.17.56-.17.08 0 .17.01.26.03.12.03.25.08.37.15.78.44 1.57.88 2.36 1.32.2.11.4.22.6.33.08.05.17.1.25.15.11.07.22.15.32.24.08.07.14.16.19.25.03.05.04.1.04.15 0 .07-.02.15-.06.24-.07.16-.25.4-.48.7l-.15.2c-.1.12-.2.25-.3.37-.04.05-.08.1-.1.15-.04.07-.06.15-.06.23 0 .1.03.2.09.3.05.08.13.17.22.25.3.28.68.6 1.1.96.22.2.45.42.68.65.2.2.4.4.58.58.1.1.2.18.28.25.06.05.12.1.16.14.04.04.08.08.1.12.04.07.06.14.06.2 0 .04-.01.08-.03.12-.04.08-.12.17-.24.27-.08.07-.16.13-.24.18l-.04.03c-.1.07-.2.12-.3.15-.08.03-.16.04-.24.04-.12 0-.24-.03-.36-.1-.2-.1-.44-.28-.7-.52-.4-.38-.84-.8-1.3-1.26l-.28-.28c-.28-.28-.56-.56-.84-.84-.2-.2-.38-.38-.54-.54-.1-.1-.18-.2-.24-.28-.04-.06-.08-.12-.1-.18-.04-.1-.06-.2-.06-.3 0-.12.03-.24.1-.36.04-.07.1-.14.17-.2.1-.1.22-.2.36-.3.04-.03.08-.06.12-.08.28-.2.6-.4.96-.6.56-.32 1.16-.64 1.8-.96.4-.2.8-.38 1.2-.56.24-.1.48-.2.72-.28.14-.05.28-.1.42-.14.08-.02.16-.04.24-.06z" />
              </svg>
              {t('support.telegram')}
            </a>
          </section>

          <section className="bg-[#161827] border border-[#1E2130] rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-2">{t('support.faq')}</h2>
            <div className="divide-y divide-white/10">
              <FAQItem question={t('support.faq1q')} answer={t('support.faq1a')} />
              <FAQItem question={t('support.faq2q')} answer={t('support.faq2a')} />
              <FAQItem question={t('support.faq3q')} answer={t('support.faq3a')} />
              <FAQItem question={t('support.faq4q')} answer={t('support.faq4a')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
