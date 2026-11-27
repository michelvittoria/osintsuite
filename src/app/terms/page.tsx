"use client";

import { useTranslation } from "@/i18n";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("legal.back")}
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("terms.title")}</h1>
        <p className="text-xs text-muted-foreground/60 mono mb-8">{t("terms.updated")}</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("terms.acceptTitle")}</h2>
            <p>{t("terms.accept")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("terms.licenseTitle")}</h2>
            <p>{t("terms.license")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("terms.usageTitle")}</h2>
            <p>{t("terms.usage")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("terms.disclaimerTitle")}</h2>
            <p>{t("terms.disclaimer")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("terms.responsibilityTitle")}</h2>
            <p>{t("terms.responsibility")}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
