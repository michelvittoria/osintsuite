"use client";

import { Github, Coffee, Shield, Server, Clock } from "lucide-react";
import { useTranslation } from "@/i18n";

const GITHUB_URL = "https://github.com/michelvittoria";
const BMC_URL = "https://www.buymeacoffee.com/michelmastn";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {/* Project */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.project")}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4 text-muted-foreground" />
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("footer.github")}
              </a>
            </div>
            <p className="text-xs text-muted-foreground/60 mono">
              {t("footer.opensource")}
            </p>
          </div>

          {/* Trust */}
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
          </div>

          {/* Support */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("footer.support")}
            </p>
            <a
              href={BMC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Coffee className="h-4 w-4" />
              {t("footer.buycoffee")}
            </a>
            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              <a
                href="/privacy"
                className="hover:text-muted-foreground transition-colors"
              >
                {t("footer.privacy")}
              </a>
              <span className="text-border/50">·</span>
              <a
                href="/terms"
                className="hover:text-muted-foreground transition-colors"
              >
                {t("footer.terms")}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/30 text-center text-xs text-muted-foreground/40 mono">
          © {new Date().getFullYear()} OSINT Suite · {t("footer.license")}
        </div>
      </div>
    </footer>
  );
}
