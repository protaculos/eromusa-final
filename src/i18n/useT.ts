"use client";
import { useSettings } from "@/context/SettingsContext";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import it from "@/messages/it.json";
import ja from "@/messages/ja.json";
import ko from "@/messages/ko.json";
import ar from "@/messages/ar.json";
import hi from "@/messages/hi.json";
import ru from "@/messages/ru.json";
import zh from "@/messages/zh.json";
import type { Locale } from "./config";

const messages: Record<string, Record<string, string>> = {
  en,
  pt,
  es,
  fr,
  de,
  it,
  ja,
  ko,
  ar,
  hi,
  ru,
  zh,
};

export function useT() {
  const { settings } = useSettings();
  const locale: Locale = (settings.language as Locale) || "en";
  const dict = messages[locale] || messages.en;

  return (key: string, fallback?: string): string => {
    return dict[key] || fallback || key;
  };
}
