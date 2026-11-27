"use client";

import { useTranslation } from "@/i18n";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, Globe, Shield, Server, Mail, Clock, Zap, CheckCircle } from "lucide-react";

export default function AboutPage() {
  const { t } = useTranslation();

  const flowSteps = [
    { icon: Globe, label: t("about.flow1") },
    { icon: Zap, label: t("about.flow2") },
    { icon: Shield, label: t("about.flow3") },
    { icon: Clock, label: t("about.flow4") },
  ];

  const groups = [
    { icon: Globe, title: t("about.groupDnsTitle"), desc: t("about.groupDns") },
    { icon: Server, title: t("about.groupWebTitle"), desc: t("about.groupWeb") },
    { icon: Zap, title: t("about.groupNetTitle"), desc: t("about.groupNet") },
    { icon: Mail, title: t("about.groupMailTitle"), desc: t("about.groupMail") },
    { icon: Clock, title: t("about.groupHistTitle"), desc: t("about.groupHist") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("legal.back")}
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("about.title")}</h1>
        <p className="text-xs text-muted-foreground/60 mono mb-8">{t("about.updated")}</p>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          {/* Intro */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">{t("about.introTitle")}</h2>
            <p>{t("about.intro")}</p>
          </section>

          {/* Flow */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-4">{t("about.flowTitle")}</h2>
            <div className="space-y-3">
              {flowSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded border border-border/50 bg-background/30">
                  <step.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="mono text-xs sm:text-sm">{step.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Modules */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">{t("about.modulesTitle")}</h2>
            <p className="mb-4">{t("about.modulesIntro")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groups.map((group, i) => (
                <div key={i} className="p-4 rounded border border-border/50 bg-background/30">
                  <div className="flex items-center gap-2 mb-2">
                    <group.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground/80">{group.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">{t("about.privacyTitle")}</h2>
            <p>{t("about.privacy")}</p>
          </section>

          {/* Limits */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">{t("about.limitsTitle")}</h2>
            <p>{t("about.limits")}</p>
          </section>

          {/* CTA */}
          <section className="pt-4 border-t border-border/30">
            <h2 className="text-base font-semibold text-foreground mb-2">{t("about.ctaTitle")}</h2>
            <p>{t("about.cta")}</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
