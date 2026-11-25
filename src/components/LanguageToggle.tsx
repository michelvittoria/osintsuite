"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "@/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "pt" : "en")}
      className="flex items-center gap-1.5 px-2 py-1 text-xs mono text-muted-foreground hover:text-primary border border-border rounded transition-colors"
      aria-label="Toggle language / Alternar idioma"
      title={locale === "en" ? "Português" : "English"}
    >
      <Languages className="h-3.5 w-3.5" />
      <span className="uppercase">{locale}</span>
    </button>
  );
}