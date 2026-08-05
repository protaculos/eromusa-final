"use client";
import React, { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useT } from "@/i18n/useT";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português (Brasil)" },
  { code: "es", label: "Español" },
];

const LANG_LABELS: Record<string, string> = {
  en: "English",
  pt: "Português (Brasil)",
  es: "Español",
};

export default function CookieConsentModal() {
  const { settings, updateSettings } = useSettings();
  const t = useT();
  const initialLang = LANGUAGES.find((l) => l.code === settings.language)
    ? settings.language
    : "en";

  const [isOpen, setIsOpen] = useState(true);
  const [lang, setLang] = useState(initialLang);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentLangLabel = LANG_LABELS[lang] ?? "English";

  const handleContinue = () => {
    updateSettings({ language: lang });
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0A0B14] border border-[#1E2130] rounded-2xl shadow-2xl p-6">
        {/* Title */}
        <h2 className="text-lg font-bold text-white text-center mb-5">
          {t('cookie.title')}
        </h2>

        {/* Warnings with outline emoji-style icons */}
        <div className="space-y-3 mb-5">
          {[t('cookie.warning1'), t('cookie.warning2'), t('cookie.warning3')].map((text, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 text-sm text-white/80"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60">
                {idx === 0 && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M7 17h10M9.5 7v6M14.5 7v6" />
                    <path d="M8 7h8" />
                  </svg>
                )}
                {idx === 1 && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                )}
                {idx === 2 && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M9 13h6M9 17h3" />
                  </svg>
                )}
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Policy text */}
        <p className="text-xs text-white/50 leading-relaxed mb-5 text-center">
          {t('cookie.policy')}
        </p>

        {/* Divider */}
        <div className="h-px bg-[#1E2130] mb-4" />

        {/* Language selector */}
        <div className="relative mb-4">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#161827] border border-[#1E2130] text-sm text-white/80 hover:text-white hover:border-white/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-white/40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              {t('cookie.languageLabel')}: <span className="text-white font-medium">{currentLangLabel}</span>
            </span>
            <svg
              className={`w-4 h-4 text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 mt-2 w-full bg-[#0A0B14] border border-[#1E2130] rounded-xl shadow-2xl overflow-hidden">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    l.code === lang
                      ? "bg-[#EE5F96]/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-[#161827]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1E2130] mb-4" />

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-[#EE5F96] hover:bg-[#d94d7e] text-white transition-colors"
        >
          {t('cookie.continue')}
        </button>
      </div>
    </div>
  );
}
