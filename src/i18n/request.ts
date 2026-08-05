import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value as Locale | undefined;
  const headerLocale = (await headers()).get("accept-language")?.split(",")[0]?.split("-")[0] as Locale | undefined;
  const locale: Locale = cookieLocale && locales.includes(cookieLocale)
    ? cookieLocale
    : headerLocale && locales.includes(headerLocale)
    ? headerLocale
    : defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "UTC",
  };
});
