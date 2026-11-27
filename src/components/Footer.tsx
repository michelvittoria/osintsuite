"use client";

import { Github, Coffee, Shield, Server, Clock, Info, BookOpen, FileText, Scale } from "lucide-react";
import { useTranslation } from "@/i18n";

const GITHUB_URL = "https://github.com/michelvittoria";
const BMC_URL = "https://www.buymeacoffee.com/michelmastn";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {/* Project */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.project")}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mono">
              <Github className="h-3 w-3 flex-shrink-0" />
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
              >
                {t("footer.github")}
              </a>
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.trust")}
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground/70 mono">
              <li className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {t("footer.cached")}
              </li>
              <li className="flex items-center gap-1.5">
                <Server className="h-3 w-3" />
                {t("footer.notstored")}
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                {t("footer.static")}
              </li>
            </ul>
            <div className="flex flex-col gap-1.5 pt-1 text-xs text-muted-foreground/60">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 flex-shrink-0" />
                <a href="/privacy" className="hover:text-muted-foreground transition-colors">
                  {t("footer.privacy")}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Scale className="h-3 w-3 flex-shrink-0" />
                <a href="/terms" className="hover:text-muted-foreground transition-colors">
                  {t("footer.terms")}
                </a>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.aboutTitle")}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mono">
              <Info className="h-3 w-3 flex-shrink-0" />
              <a href="/about" className="hover:text-muted-foreground transition-colors">
                {t("footer.about")}
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mono">
              <BookOpen className="h-3 w-3 flex-shrink-0" />
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
              >
                {t("footer.docs")}
              </a>
            </div>
          </div>

          {/* Donation */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.donation")}
            </p>
            <a
              href={BMC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#FFDD00] text-[#0D0C22] text-sm font-semibold hover:bg-[#FFE94D] transition-colors"
            >
              <Coffee className="h-3.5 w-3.5" />
              <span>{t("footer.donation")}</span>
            </a>
            <p className="text-xs text-muted-foreground/60 mono">
              {t("footer.donationNote")}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/30 text-center text-xs text-muted-foreground/40 mono">
          © {new Date().getFullYear()} OSINT Suite · {t("footer.opensource")}
        </div>
      </div>
    </footer>
  );
}
