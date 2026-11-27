"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Locale } from "./locale";
import enDict from "./dicts/en.json";
import ptDict from "./dicts/pt.json";

type Dict = Record<string, string>;

const dicts: Record<Locale, Dict> = {
  en: enDict as Dict,
  pt: ptDict as Dict,
};

let currentLocale: Locale = "en";

export async function getDict(locale: Locale): Promise<Dict> {
  return dicts[locale];
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
  const [dict, setDict] = useState<Dict>(dicts[initialLocale]);

  useEffect(() => {
    setDict(dicts[locale]);
    if (typeof document !== "undefined") {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const str = dict[key] || key;
    return params ? interpolate(str, params) : str;
  };

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
