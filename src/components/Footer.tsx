"use client";

import { Github, Coffee, Info, BookOpen, FileText, Scale } from "lucide-react";
import { useTranslation } from "@/i18n";

const GITHUB_URL = "https://github.com/michelvittoria";
const BMC_URL = "https://www.buymeacoffee.com/michelmastn";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {/* Project */}
          <div className="h-full flex flex-col space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.project")}
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground/70 mono">
              <li className="flex items-center gap-1.5">
                <Github className="h-3 w-3 flex-shrink-0" />
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  {t("footer.github")}
                </a>
              </li>
            </ul>
          </div>

          {/* Privacy */}
          <div className="h-full flex flex-col space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.trust")}
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground/70 mono">
              <li className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 flex-shrink-0" />
                <a href="/privacy" className="hover:text-muted-foreground transition-colors">
                  {t("footer.privacy")}
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <Scale className="h-3 w-3 flex-shrink-0" />
                <a href="/terms" className="hover:text-muted-foreground transition-colors">
                  {t("footer.terms")}
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="h-full flex flex-col space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.aboutTitle")}
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground/70 mono">
              <li className="flex items-center gap-1.5">
                <Info className="h-3 w-3 flex-shrink-0" />
                <a href="/about" className="hover:text-muted-foreground transition-colors">
                  {t("footer.about")}
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 flex-shrink-0" />
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  {t("footer.docs")}
                </a>
              </li>
            </ul>
          </div>

          {/* Donation */}
          <div className="h-full flex flex-col space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.donation")}
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground/70 mono">
              <li>
                <a
                  href={BMC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFDD00] text-[#0D0C22] text-xs font-semibold hover:bg-[#FFE94D] transition-colors"
                >
                  <Coffee className="h-3 w-3" />
                  <span>{t("footer.donation")}</span>
                </a>
              </li>
              <li className="text-muted-foreground/60">
                {t("footer.donationNote")}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/30 text-center text-xs text-muted-foreground/40 mono">
          © {new Date().getFullYear()} OSINT Suite · {t("footer.opensource")}
        </div>
      </div>
    </footer>
  );
}
