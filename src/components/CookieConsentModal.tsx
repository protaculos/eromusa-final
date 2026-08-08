"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { languageOptions, type Locale } from "@/i18n/config";
import { useSettings } from "@/context/SettingsContext";
import { useT } from "@/i18n/useT";

const SUPPORTED = new Set<string>(languageOptions.map((l) => l.code));

function detectLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  for (const candidate of candidates) {
    const base = candidate.split("-")[0];
    if (SUPPORTED.has(candidate)) return candidate;
    if (SUPPORTED.has(base)) return base;
  }

  return "en";
}

export default function CookieConsentModal() {
  const { settings, updateSettings } = useSettings();
  const t = useT();

  const detectedLanguage = useMemo(() => detectLanguage(), []);
  const initialLang = useMemo(() => {
    if (SUPPORTED.has(detectedLanguage)) return detectedLanguage;
    if (SUPPORTED.has(settings.language) && settings.language !== "en") return settings.language;
    return "en";
  }, [detectedLanguage, settings.language]);

  const [isOpen, setIsOpen] = useState(true);
  const [lang, setLang] = useState(initialLang);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    updateSettings({ language: initialLang as Locale });
  }, [initialLang, updateSettings]);

  const currentLangLabel =
    languageOptions.find((l) => l.code === lang)?.label ?? "English";

  // Atualiza o idioma global imediatamente ao selecionar uma língua,
  // para o conteúdo do modal (título, avisos, botão) trocar na hora.
  const handleSelectLang = (code: string) => {
    setLang(code);
    updateSettings({ language: code as Locale });
    setDropdownOpen(false);
  };

  const handleContinue = () => {
    updateSettings({ language: lang });
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-[#0A0B14] border border-[#1E2130] rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-white text-center mb-5">
          {t('cookie.title')}
        </h2>

        <div className="space-y-3 mb-5">
          {[t('cookie.warning1'), t('cookie.warning2'), t('cookie.warning3')].map((text, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm text-white/80">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60">
                {idx === 0 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <text x="12" y="15" fontSize="8" fontWeight="bold" textAnchor="middle" fill="currentColor">18+</text>
                  </svg>
                )}
                {idx === 1 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                {idx === 2 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                )}
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/50 leading-relaxed mb-5 text-center">
          {t('cookie.policy')}{" "}
          <Link href="/terms-of-use" className="underline underline-offset-4 text-white/70 hover:text-white transition-colors">
            {t('nav.terms')}
          </Link>{" "}
          {t('cookie.and')}{" "}
          <Link href="/privacy-policy" className="underline underline-offset-4 text-white/70 hover:text-white transition-colors">
            {t('nav.privacy')}
          </Link>.
        </p>

        <div className="h-px bg-[#1E2130] mb-4" />

        <div className="relative mb-4">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            aria-expanded={dropdownOpen}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#161827] border border-[#1E2130] text-sm text-white/80 hover:text-white hover:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#EE5F96]/60"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
            <div className="absolute z-10 mt-2 w-full bg-[#0A0B14] border border-[#1E2130] rounded-xl shadow-2xl max-h-[240px] overflow-y-auto">
              {languageOptions.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleSelectLang(l.code)}
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

        <div className="h-px bg-[#1E2130] mb-4" />

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
