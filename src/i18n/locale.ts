export type Locale = "en" | "pt";

export function getLocaleFromHost(host: string): Locale {
  if (host.includes(".br")) return "pt";
  return "en";
}

export function getLocaleFromCookie(cookieHeader: string | null): Locale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/NEXT_LOCALE=([^;]+)/);
  if (match && (match[1] === "en" || match[1] === "pt")) return match[1] as Locale;
  return null;
}
