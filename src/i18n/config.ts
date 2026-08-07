export type Locale =
  | "en"
  | "pt"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "ja"
  | "ko"
  | "ar"
  | "hi"
  | "ru"
  | "zh";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = [
  "en",
  "pt",
  "es",
  "fr",
  "de",
  "it",
  "ja",
  "ko",
  "ar",
  "hi",
  "ru",
  "zh",
];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  hi: "हिन्दी",
  ru: "Русский",
  zh: "中文",
};