"use client";

import { useTranslation } from "@/i18n";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("privacy.title")}</h1>
        <p className="text-xs text-muted-foreground/60 mono mb-8">{t("privacy.updated")}</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("privacy.introTitle")}</h2>
            <p>{t("privacy.intro")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("privacy.dataTitle")}</h2>
            <p>{t("privacy.data")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("privacy.ipTitle")}</h2>
            <p>{t("privacy.ip")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("privacy.cookiesTitle")}</h2>
            <p>{t("privacy.cookies")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("privacy.thirdPartyTitle")}</h2>
            <p>{t("privacy.thirdParty")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("privacy.contactTitle")}</h2>
            <p>{t("privacy.contact")}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
