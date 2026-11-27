"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Terminal,
  ChevronRight,
  Globe,
  FileText,
  Shield,
  Radio,
  Plug,
  Search as SearchIcon,
  MapPin,
  GitBranch,
  FileKey,
  Bot,
  Key,
  Mail,
  Waypoints,
  Cpu,
  Share2,
  Route,
  Clock,
  Database,
  MailSearch,
  Server,
  Github,
  Coffee,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import Footer from "@/components/Footer";

const GITHUB_URL = "https://github.com/michelvittoria";
const BMC_URL = "https://www.buymeacoffee.com/michelmastn";

const MODULES = [
  { key: "dns", Icon: Globe, labelKey: "module.dns", descKey: "moduleDesc.dns" },
  { key: "whois", Icon: FileText, labelKey: "module.whois", descKey: "moduleDesc.whois" },
  { key: "ssl", Icon: Shield, labelKey: "module.ssl", descKey: "moduleDesc.ssl" },
  { key: "http", Icon: Radio, labelKey: "module.http", descKey: "moduleDesc.http" },
  { key: "ports", Icon: Plug, labelKey: "module.ports", descKey: "moduleDesc.ports" },
  { key: "subdomains", Icon: SearchIcon, labelKey: "module.subdomains", descKey: "moduleDesc.subdomains" },
  { key: "ipGeo", Icon: MapPin, labelKey: "module.ipGeo", descKey: "moduleDesc.ipGeo" },
  { key: "ctLogs", Icon: GitBranch, labelKey: "module.ctLogs", descKey: "moduleDesc.ctLogs" },
  { key: "securityTxt", Icon: FileKey, labelKey: "module.securityTxt", descKey: "moduleDesc.securityTxt" },
  { key: "robotsTxt", Icon: Bot, labelKey: "module.robotsTxt", descKey: "moduleDesc.robotsTxt" },
  { key: "dnssec", Icon: Key, labelKey: "module.dnssec", descKey: "moduleDesc.dnssec" },
  { key: "emailSecurity", Icon: Mail, labelKey: "module.emailSecurity", descKey: "moduleDesc.emailSecurity" },
  { key: "asnLookup", Icon: Waypoints, labelKey: "module.asnLookup", descKey: "moduleDesc.asnLookup" },
  { key: "techFingerprint", Icon: Cpu, labelKey: "module.techFingerprint", descKey: "moduleDesc.techFingerprint" },
  { key: "cdnDetection", Icon: Server, labelKey: "module.cdnDetection", descKey: "moduleDesc.cdnDetection" },
  { key: "reverseIp", Icon: Share2, labelKey: "module.reverseIp", descKey: "moduleDesc.reverseIp" },
  { key: "traceroute", Icon: Route, labelKey: "module.traceroute", descKey: "moduleDesc.traceroute" },
  { key: "wayback", Icon: Clock, labelKey: "module.wayback", descKey: "moduleDesc.wayback" },
  { key: "axfr", Icon: Database, labelKey: "module.axfr", descKey: "moduleDesc.axfr" },
  { key: "emailHarvest", Icon: MailSearch, labelKey: "module.emailHarvest", descKey: "moduleDesc.emailHarvest" },
] as const;

export default function HomePage() {
  const { t } = useTranslation();
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target.trim());
  const isDomain = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(target.trim());
  const isValid = isIp || isDomain;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = target.trim().toLowerCase();
    if (!isValid) {
      setError(t("error.invalidTarget"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("error.scanInit"));
        return;
      }

      router.push(`/scan/${data.jobId}`);
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none animate-sweep">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>

        <div className="relative w-full max-w-xl sm:max-w-2xl lg:max-w-3xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Terminal className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("header.title")}</h1>
                <p className="label">{t("header.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
                title={t("nav.github")}
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href={BMC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFDD00] text-[#0D0C22] text-xs font-semibold hover:bg-[#FFE94D] transition-colors"
                aria-label={t("nav.support")}
                title={t("nav.support")}
              >
                <Coffee className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("nav.support")}</span>
              </a>
              <span className="hidden sm:inline text-xs mono text-muted-foreground">{t("header.langLabel")}</span>
              <LanguageToggle />
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="panel p-4 sm:p-6 space-y-4">
          <div className="relative">
            <label htmlFor="target" className="label block mb-2">
              {t("home.targetLabel")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                id="target"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={t("home.placeholder")}
                className="w-full pl-10 pr-4 py-3 sm:py-4 border border-input bg-background/50 rounded text-base sm:text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50 mono"
                disabled={loading}
                autoFocus
                spellCheck={false}
              />
            </div>
            {target.trim() && (
              <p className="mt-2 text-xs mono text-muted-foreground">
                {t("home.detected")}{" "}
                <span className="text-primary">
                  {isIp ? t("home.typeIp") : isDomain ? t("home.typeDomain") : t("home.typeUnknown")}
                </span>
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 border border-destructive/30 bg-destructive/10 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="mono">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !target.trim()}
            className="w-full py-3.5 sm:py-4 bg-primary text-primary-foreground rounded font-medium text-base sm:text-lg transition-all hover:shadow-[0_0_24px_hsl(var(--signal)/0.4)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("home.initializing")}</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>{t("home.startScan")}</span>
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Modules list */}
        <div className="mt-6 sm:mt-8 panel p-4 sm:p-5">
          <p className="label mb-3">{t("home.modules")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 text-sm">
            {MODULES.map((m, i) => (
              <div
                key={m.key}
                className="group relative flex items-center gap-2 text-muted-foreground/80 hover:text-foreground transition-colors cursor-help"
              >
                <m.Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="mono truncate">{t(m.labelKey)}</span>
                <div className="absolute left-0 top-full mt-1 z-50 hidden md:block w-64 sm:w-72 p-3 text-xs mono text-muted-foreground bg-card border border-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-normal">
                  {t(m.descKey)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 sm:mt-6 text-center text-xs text-muted-foreground/60 mono">
          {t("home.footer")}
        </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "pt" : "en")}
      className="flex items-center gap-1.5 px-2 py-1 text-xs mono text-muted-foreground hover:text-primary border border-border rounded transition-colors"
      aria-label={locale === "en" ? "Português" : "English"}
      title={locale === "en" ? "Português" : "English"}
    >
      <span className="uppercase">{locale}</span>
    </button>
  );
}