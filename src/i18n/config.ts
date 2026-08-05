export type Locale = "en" | "pt" | "es";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "pt", "es"];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};
