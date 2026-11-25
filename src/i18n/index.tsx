"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Locale } from "./locale";

type Dict = Record<string, string>;

const dicts: Record<Locale, () => Promise<Dict>> = {
  en: () => import("./dicts/en.json").then((m) => m.default),
  pt: () => import("./dicts/pt.json").then((m) => m.default),
};

let cachedDict: Dict | null = null;
let currentLocale: Locale = "en";

export async function getDict(locale: Locale): Promise<Dict> {
  if (cachedDict && currentLocale === locale) return cachedDict;
  const dict = await dicts[locale]();
  cachedDict = dict;
  currentLocale = locale;
  return dict;
}

function interpolate(str: string, params: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

interface I18nContextType {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dict, setDict] = useState<Dict>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getDict(locale).then((d) => {
      if (mounted) {
        setDict(d);
        setReady(true);
      }
    });
    return () => { mounted = false; };
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof document !== "undefined") {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const str = dict[key] || key;
    return params ? interpolate(str, params) : str;
  };

  if (!ready) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { locale: "en" as Locale, t: (k: string) => k, setLocale: () => {} };
  }
  return ctx;
}