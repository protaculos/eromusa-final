"use client";
import { useSettings } from "@/context/SettingsContext";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import es from "@/messages/es.json";
import type { Locale } from "./config";

const messages: Record<string, Record<string, string>> = { en, pt, es };

export function useT() {
  const { settings } = useSettings();
  const locale: Locale = (settings.language as Locale) || "en";
  const dict = messages[locale] || messages.en;

  return (key: string, fallback?: string): string => {
    return dict[key] || fallback || key;
  };
}
