"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  Globe,
  Shield,
  Server,
  Network,
  Search,
  FileText,
  Terminal,
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
  Clock as ClockIcon,
  Database,
  MailSearch,
} from "lucide-react";
import type { JobState, ScanResult } from "@/lib/types";
import { useTranslation } from "@/i18n";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  dns: <Globe className="h-3.5 w-3.5" />,
  whois: <FileText className="h-3.5 w-3.5" />,
  ssl: <Shield className="h-3.5 w-3.5" />,
  http: <Server className="h-3.5 w-3.5" />,
  ports: <Network className="h-3.5 w-3.5" />,
  subdomains: <Search className="h-3.5 w-3.5" />,
  ipGeo: <MapPin className="h-3.5 w-3.5" />,
  ctLogs: <GitBranch className="h-3.5 w-3.5" />,
  securityTxt: <FileKey className="h-3.5 w-3.5" />,
  robotsTxt: <Bot className="h-3.5 w-3.5" />,
  dnssec: <Key className="h-3.5 w-3.5" />,
  emailSecurity: <Mail className="h-3.5 w-3.5" />,
  asnLookup: <Waypoints className="h-3.5 w-3.5" />,
  techFingerprint: <Cpu className="h-3.5 w-3.5" />,
  cdnDetection: <Server className="h-3.5 w-3.5" />,
  reverseIp: <Share2 className="h-3.5 w-3.5" />,
  traceroute: <Route className="h-3.5 w-3.5" />,
  wayback: <ClockIcon className="h-3.5 w-3.5" />,
  axfr: <Database className="h-3.5 w-3.5" />,
  emailHarvest: <MailSearch className="h-3.5 w-3.5" />,
};

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { t } = useTranslation();

  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dns");

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/scan/${jobId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError(t("error.notFound"));
            clearInterval(interval);
            return;
          }
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        if (cancelled) return;
        setJob(data);

        if (data.status === "done" || data.status === "error") {
          clearInterval(interval);
        }
      } catch {
        if (!cancelled) setError(t("error.connection"));
      }
    };

    poll();
    interval = setInterval(poll, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, t]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center panel p-6 sm:p-8 max-w-md w-full">
          <XCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">{t("scan.errorTitle")}</h1>
          <p className="text-muted-foreground mb-6 mono text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium hover:shadow-[0_0_20px_hsl(var(--signal)/0.4)] transition-all"
          >
            {t("scan.backToSearch")}
          </button>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="label">{t("scan.connecting")}</p>
        </div>
      </main>
    );
  }

  const isDone = job.status === "done";
  const isError = job.status === "error";
  const doneCount = Object.values(job.modules).filter((s) => s === "done").length;
  const totalCount = Object.keys(job.modules).length;

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="p-2 border border-border hover:border-primary/50 hover:bg-secondary rounded transition-colors flex-shrink-0"
            aria-label={t("scan.back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="label">{t("scan.target")}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-all">{job.domain}</h1>
            <p className="text-xs text-muted-foreground mono mt-1">
              {isDone
                ? `${t("scan.complete")} — ${doneCount}/${totalCount} ${t("scan.modules")}`
                : isError
                ? t("error.scanFailed")
                : `${t("scan.scanning")} — ${doneCount}/${totalCount} ${t("scan.modules")}`}
            </p>
          </div>
        </div>

        {isDone && (
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`/api/export/${jobId}?format=json`}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-border hover:border-primary/50 hover:bg-secondary rounded text-xs mono transition-colors flex-1 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5" />
              {t("export.json")}
            </a>
            <a
              href={`/api/export/${jobId}?format=csv`}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-border hover:border-primary/50 hover:bg-secondary rounded text-xs mono transition-colors flex-1 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5" />
              {t("export.csv")}
            </a>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isDone && !isError && (
        <div className="mb-6 h-1 bg-secondary rounded overflow-hidden relative">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Module status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
        {Object.entries(job.modules).map(([name, status]) => (
          <div
            key={name}
            className={`flex items-center gap-2 px-3 py-2.5 rounded border text-xs mono transition-colors ${
              status === "done"
                ? "border-primary/30 bg-primary/5 text-primary"
                : status === "error"
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : status === "running"
                ? "border-primary/50 bg-primary/10 text-primary animate-signal"
                : "border-border text-muted-foreground"
            }`}
          >
            {status === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            ) : status === "error" ? (
              <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            ) : status === "running" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{t(`label.${name}`)}</span>
          </div>
        ))}
      </div>

      {isError && (
        <div className="p-4 border border-destructive/30 bg-destructive/10 rounded text-destructive mb-6 mono text-sm">
          {job.error || t("error.scanFailed")}
        </div>
      )}

      {/* Results */}
      {isDone && job.result && (
        <ResultView result={job.result} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </main>
  );
}

function ResultView({
  result,
  activeTab,
  setActiveTab,
}: {
  result: ScanResult;
  activeTab: string;
  setActiveTab: (t: string) => void;
}) {
  const { t } = useTranslation();
  const tabs = [
    { id: "dns", label: t("tab.dns"), data: result.modules.dns },
    { id: "whois", label: t("tab.whois"), data: result.modules.whois },
    { id: "ssl", label: t("tab.ssl"), data: result.modules.ssl },
    { id: "http", label: t("tab.http"), data: result.modules.http },
    { id: "ports", label: t("tab.ports"), data: result.modules.ports },
    ...(result.targetType === "ip"
      ? [{ id: "ipGeo", label: t("tab.ipGeo"), data: result.modules.ipGeo }]
      : [
          { id: "subdomains", label: t("tab.subdomains"), data: result.modules.subdomains },
          { id: "ctLogs", label: t("tab.ctLogs"), data: result.modules.ctLogs },
          { id: "securityTxt", label: t("tab.securityTxt"), data: result.modules.securityTxt },
          { id: "robotsTxt", label: t("tab.robotsTxt"), data: result.modules.robotsTxt },
          { id: "dnssec", label: t("tab.dnssec"), data: result.modules.dnssec },
          { id: "emailSecurity", label: t("tab.emailSecurity"), data: result.modules.emailSecurity },
          { id: "asnLookup", label: t("tab.asnLookup"), data: result.modules.asnLookup },
          { id: "techFingerprint", label: t("tab.techFingerprint"), data: result.modules.techFingerprint },
          { id: "cdnDetection", label: t("tab.cdnDetection"), data: result.modules.cdnDetection },
          { id: "reverseIp", label: t("tab.reverseIp"), data: result.modules.reverseIp },
          { id: "traceroute", label: t("tab.traceroute"), data: result.modules.traceroute },
          { id: "wayback", label: t("tab.wayback"), data: result.modules.wayback },
          { id: "axfr", label: t("tab.axfr"), data: result.modules.axfr },
          { id: "emailHarvest", label: t("tab.emailHarvest"), data: result.modules.emailHarvest },
        ]),
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {MODULE_ICONS[tab.id]}
            {tab.label}
            {result.errors[tab.id] && (
              <XCircle className="h-3 w-3 text-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "dns" && <DnsView data={result.modules.dns} error={result.errors.dns} />}
        {activeTab === "whois" && <WhoisView data={result.modules.whois} error={result.errors.whois} />}
        {activeTab === "ssl" && <SslView data={result.modules.ssl} error={result.errors.ssl} />}
        {activeTab === "http" && <HttpView data={result.modules.http} error={result.errors.http} />}
        {activeTab === "ports" && <PortsView data={result.modules.ports} error={result.errors.ports} />}
        {activeTab === "subdomains" && <SubdomainsView data={result.modules.subdomains} error={result.errors.subdomains} />}
        {activeTab === "ctLogs" && <CtLogsView data={result.modules.ctLogs} error={result.errors.ctLogs} />}
        {activeTab === "securityTxt" && <SecurityTxtView data={result.modules.securityTxt} error={result.errors.securityTxt} />}
        {activeTab === "robotsTxt" && <RobotsTxtView data={result.modules.robotsTxt} error={result.errors.robotsTxt} />}
        {activeTab === "dnssec" && <DnssecView data={result.modules.dnssec} error={result.errors.dnssec} />}
        {activeTab === "emailSecurity" && <EmailSecurityView data={result.modules.emailSecurity} error={result.errors.emailSecurity} />}
        {activeTab === "asnLookup" && <AsnLookupView data={result.modules.asnLookup} error={result.errors.asnLookup} />}
        {activeTab === "techFingerprint" && <TechFingerprintView data={result.modules.techFingerprint} error={result.errors.techFingerprint} />}
        {activeTab === "cdnDetection" && <CdnDetectionView data={result.modules.cdnDetection} error={result.errors.cdnDetection} />}
        {activeTab === "reverseIp" && <ReverseIpView data={result.modules.reverseIp} error={result.errors.reverseIp} />}
        {activeTab === "traceroute" && <TracerouteView data={result.modules.traceroute} error={result.errors.traceroute} />}
        {activeTab === "wayback" && <WaybackView data={result.modules.wayback} error={result.errors.wayback} />}
        {activeTab === "axfr" && <AxfrView data={result.modules.axfr} error={result.errors.axfr} />}
        {activeTab === "emailHarvest" && <EmailHarvestView data={result.modules.emailHarvest} error={result.errors.emailHarvest} />}
        {activeTab === "ipGeo" && <IpGeoView data={result.modules.ipGeo} error={result.errors.ipGeo} />}
      </div>
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  return (
    <div className="p-4 border border-destructive/30 bg-destructive/10 rounded text-destructive text-sm mono">
      {error}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <h3 className="label mb-3 pb-2 border-b border-border">{title}</h3>
      {children}
    </div>
  );
}

function DnsView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("view.aRecords")}>
        <div className="space-y-1.5 mono text-sm">
          {data.records.length === 0 && <span className="text-muted-foreground">{t("view.noRecords")}</span>}
          {data.records.map((r: any, i: number) => (
            <div key={i} className="flex gap-3">
              <span className="text-primary w-14 flex-shrink-0">{r.type}</span>
              <span className="break-all">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("view.nameservers")}>
        <div className="space-y-1.5 mono text-sm">
          {data.nameservers.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
          {data.nameservers.map((ns: string, i: number) => (
            <div key={i} className="break-all">{ns}</div>
          ))}
        </div>
      </Card>

      <Card title={t("view.mxRecords")}>
        <div className="space-y-1.5 mono text-sm">
          {data.mx.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
          {data.mx.map((m: any, i: number) => (
            <div key={i} className="flex gap-3">
              <span className="text-primary w-8 flex-shrink-0">{m.priority}</span>
              <span className="break-all">{m.exchange}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("view.txtRecords")}>
        <div className="space-y-1.5 mono text-xs">
          {data.txt.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
          {data.txt.map((t: string, i: number) => (
            <div key={i} className="break-all">{t}</div>
          ))}
        </div>
      </Card>

      {data.soa && (
        <Card title={t("view.soa")}>
          <div className="space-y-1.5 mono text-sm">
            <Row label={t("field.ns")} value={data.soa.nsname} />
            <Row label={t("field.hostmaster")} value={data.soa.hostmaster} />
            <Row label={t("field.serial")} value={String(data.soa.serial)} />
          </div>
        </Card>
      )}
    </div>
  );
}

function WhoisView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("view.registration")}>
        <div className="space-y-2 text-sm">
          <Row label={t("field.registrar")} value={data.registrar} />
          <Row label={t("field.registrant")} value={data.registrant} />
          <Row label={t("field.created")} value={data.createdDate} />
          <Row label={t("field.updated")} value={data.updatedDate} />
          <Row label={t("field.expiry")} value={data.expiryDate} />
        </div>
      </Card>

      <Card title={t("view.nameservers")}>
        <div className="space-y-1.5 mono text-sm">
          {data.nameservers.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
          {data.nameservers.map((ns: string, i: number) => (
            <div key={i} className="break-all">{ns}</div>
          ))}
        </div>
      </Card>

      <Card title={t("view.status")}>
        <div className="space-y-1 text-sm">
          {data.status.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
          {data.status.map((s: string, i: number) => (
            <div key={i} className="mono text-xs break-all">{s}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SslView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const expiringSoon = data.daysRemaining < 30;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("view.certificate")}>
        <div className="space-y-2 text-sm">
          <Row label={t("field.subject")} value={data.subject} />
          <Row label={t("field.issuer")} value={data.issuer} />
          <Row label={t("field.protocol")} value={data.protocol} />
          <Row label={t("field.serial")} value={data.serialNumber} mono />
        </div>
      </Card>

      <Card title={t("view.validity")}>
        <div className="space-y-2 text-sm">
          <Row label={t("field.validFrom")} value={new Date(data.validFrom).toLocaleString()} />
          <Row label={t("field.validTo")} value={new Date(data.validTo).toLocaleString()} />
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground flex-shrink-0">{t("field.daysRemaining")}</span>
            <span className={`mono font-semibold ${expiringSoon ? "text-destructive" : "text-primary"}`}>
              {data.daysRemaining}
            </span>
          </div>
        </div>
      </Card>

      <Card title={`${t("view.sans")} (${data.sans.length})`}>
        <div className="space-y-1 mono text-xs max-h-64 overflow-y-auto">
          {data.sans.map((san: string, i: number) => (
            <div key={i} className="break-all">{san}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function HttpView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("view.response")}>
        <div className="space-y-2 text-sm">
          <Row label={t("view.status")} value={`${data.status} ${data.statusText}`} />
          <Row label={t("field.server")} value={data.server} />
          <Row label={t("field.finalUrl")} value={data.finalUrl} mono />
          <Row label={t("field.title")} value={data.title} />
        </div>
      </Card>

      {data.redirects.length > 1 && (
        <Card title={t("view.redirectChain")}>
          <div className="space-y-1 mono text-xs">
            {data.redirects.map((r: string, i: number) => (
              <div key={i} className="break-all">
                <span className="text-primary">{i + 1}.</span> {r}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={t("view.headers")}>
        <div className="space-y-1 mono text-xs max-h-96 overflow-y-auto">
          {Object.entries(data.headers).map(([k, v]) => (
            <div key={k} className="break-all">
              <span className="text-muted-foreground">{k}:</span> {String(v)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PortsView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const open = data.filter((p: any) => p.open);
  const closed = data.filter((p: any) => !p.open);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={`${t("view.openPorts")} (${open.length})`}>
        <div className="space-y-1.5 mono text-sm">
          {open.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
          {open.map((p: any) => (
            <div key={p.port} className="flex gap-3">
              <span className="text-primary w-12 flex-shrink-0">{p.port}</span>
              <span className="text-muted-foreground">{p.service}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={`${t("view.closedPorts")} (${closed.length})`}>
        <div className="flex flex-wrap gap-1.5 mono text-xs">
          {closed.map((p: any) => (
            <span key={p.port} className="px-2 py-1 border border-border rounded text-muted-foreground">
              {p.port}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SubdomainsView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <Card title={t("view.foundSubdomains", { n: data.length })}>
      <div className="space-y-1.5 mono text-sm">
        {data.length === 0 && <span className="text-muted-foreground">{t("view.noneFound")}</span>}
        {data.map((s: any, i: number) => (
          <div key={i} className="flex gap-3 flex-wrap">
            <span className="break-all">{s.subdomain}</span>
            <span className="text-muted-foreground text-xs">{s.ips.join(", ")}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CtLogsView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <Card title={t("view.ctEntries", { n: data.subdomains.length })}>
      <div className="space-y-1.5 mono text-sm max-h-96 overflow-y-auto">
        {data.subdomains.length === 0 && <span className="text-muted-foreground">{t("view.noEntries")}</span>}
        {data.subdomains.map((sub: string, i: number) => (
          <div key={i} className="break-all">
            {sub}
          </div>
        ))}
      </div>
    </Card>
  );
}

function SecurityTxtView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  if (!data.exists) {
    return <Card title={t("module.securityTxt")}><span className="text-muted-foreground text-sm">{t("view.notFound")}</span></Card>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("view.parsedFields")}>
        <div className="space-y-2 text-sm">
          <Row label={t("field.contact")} value={data.contact} mono />
          <Row label={t("field.expires")} value={data.expires} />
          <Row label={t("view.policy")} value={data.policy} mono />
          <Row label={t("field.encryption")} value={data.encryption} mono />
          <Row label={t("field.acknowledgments")} value={data.acknowledgments} mono />
          <Row label={t("field.canonical")} value={data.canonical} mono />
          {data.preferredLanguages && (
            <Row label={t("field.preferredLanguages")} value={data.preferredLanguages.join(", ")} />
          )}
        </div>
      </Card>

      <Card title={t("view.rawContent")}>
        <pre className="mono text-xs whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
          {data.raw}
        </pre>
      </Card>
    </div>
  );
}

function RobotsTxtView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  if (!data.exists) {
    return <Card title={t("module.robotsTxt")}><span className="text-muted-foreground text-sm">{t("view.notFound")}</span></Card>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("view.rules")}>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="label mb-1.5 pb-1 border-b border-border">{t("view.disallow")} ({data.disallow.length})</h4>
            <div className="space-y-1 mono text-xs">
              {data.disallow.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
              {data.disallow.map((r: string, i: number) => (
                <div key={i} className="break-all">{r}</div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="label mb-1.5 pb-1 border-b border-border">{t("view.allow")} ({data.allow.length})</h4>
            <div className="space-y-1 mono text-xs">
              {data.allow.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
              {data.allow.map((r: string, i: number) => (
                <div key={i} className="break-all">{r}</div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card title={t("view.sitemaps")}>
          <div className="space-y-1 mono text-xs">
            {data.sitemaps.length === 0 && <span className="text-muted-foreground">{t("view.none")}</span>}
            {data.sitemaps.map((s: string, i: number) => (
              <div key={i} className="break-all">{s}</div>
            ))}
          </div>
        </Card>

        <Card title={t("view.crawlDelay")}>
          <div className="text-sm">
            {data.crawlDelay ? `${data.crawlDelay}s` : <span className="text-muted-foreground">{t("view.notSet")}</span>}
          </div>
        </Card>

        <Card title={t("view.rawContent")}>
          <pre className="mono text-xs whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
            {data.raw}
          </pre>
        </Card>
      </div>
    </div>
  );
}

function DnssecView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  if (!data.hasDnssec) {
    return <Card title={t("module.dnssec")}><span className="text-muted-foreground text-sm">{t("view.notEnabled")}</span></Card>;
  }

  return (
    <Card title={t("module.dnssec")}>
      <div className="space-y-2 text-sm">
        <Row label={t("view.validated")} value={data.validated ? t("view.yes") : t("view.no")} mono />
        <Row label={t("view.algorithm")} value={data.algorithm ? String(data.algorithm) : "N/A"} mono />
        <Row label={t("view.keyTag")} value={data.keyTag ? String(data.keyTag) : "N/A"} mono />
        <Row label={t("view.digestType")} value={data.digestType ? String(data.digestType) : "N/A"} mono />
        <Row label={t("view.digest")} value={data.digest || "N/A"} mono />
      </div>
    </Card>
  );
}

function EmailSecurityView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title={t("view.spf")}>
        <div className="space-y-2 text-sm">
          {data.spf ? (
            <>
              <Row label={t("field.valid")} value={data.spf.valid ? t("view.yes") : t("view.no")} mono />
              <Row label={t("view.allMechanism")} value={data.spf.all} mono />
              <Row label={t("view.record")} value={data.spf.record} mono />
            </>
          ) : (
            <span className="text-muted-foreground">{t("view.notFound")}</span>
          )}
        </div>
      </Card>

      <Card title={t("view.dmarc")}>
        <div className="space-y-2 text-sm">
          {data.dmarc ? (
            <>
              <Row label={t("view.policy")} value={data.dmarc.policy} mono />
              <Row label={t("field.pct")} value={`${data.dmarc.pct}%`} mono />
              <Row label={t("view.record")} value={data.dmarc.record} mono />
            </>
          ) : (
            <span className="text-muted-foreground">{t("view.notFound")}</span>
          )}
        </div>
      </Card>

      <Card title={t("view.dkim")}>
        <div className="space-y-2 text-sm">
          {data.dkim.selectors.length > 0 ? (
            <>
              <Row label={t("view.selectors")} value={data.dkim.selectors.join(", ")} mono />
              {data.dkim.selectors.map((s: string) => (
                <Row key={s} label={s} value={data.dkim.records[s]?.slice(0, 80)} mono />
              ))}
            </>
          ) : (
            <span className="text-muted-foreground">{t("view.noSelectors")}</span>
          )}
        </div>
      </Card>
    </div>
  );
}

function AsnLookupView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  if (data.asns.length === 0) {
    return <Card title={t("module.asnLookup")}><span className="text-muted-foreground text-sm">{t("view.noAsn")}</span></Card>;
  }

  return (
    <Card title={t("view.asnEntries", { n: data.asns.length })}>
      <div className="space-y-3 text-sm">
        {data.asns.map((a: any, i: number) => (
          <div key={i} className="border-t border-border pt-3 first:border-0 first:pt-0">
            <Row label={t("field.ip")} value={a.ip} mono />
            <Row label={t("field.asn")} value={a.asn} mono />
            <Row label={t("field.organization")} value={a.org} />
            <Row label={t("field.isp")} value={a.isp} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function IpGeoView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("view.location")}>
        <div className="space-y-2 text-sm">
          <Row label={t("field.ip")} value={data.query} mono />
          <Row label={t("field.country")} value={data.country} />
          <Row label={t("field.countryCode")} value={data.countryCode} mono />
          <Row label={t("field.region")} value={data.regionName} />
          <Row label={t("field.city")} value={data.city} />
          <Row label={t("field.timezone")} value={data.timezone} mono />
        </div>
      </Card>

      <Card title={t("view.network")}>
        <div className="space-y-2 text-sm">
          <Row label={t("field.isp")} value={data.isp} />
          <Row label={t("field.organization")} value={data.org} />
          <Row label={t("field.asn")} value={data.asn} mono />
        </div>
      </Card>
    </div>
  );
}

function TechFingerprintView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  if (data.technologies.length === 0) {
    return <Card title={t("module.techFingerprint")}><span className="text-muted-foreground text-sm">{t("view.noTech")}</span></Card>;
  }

  return (
    <Card title={t("view.techDetected", { n: data.technologies.length })}>
      <div className="space-y-3 text-sm">
        {data.technologies.map((t: any, i: number) => (
          <div key={i} className="border-t border-border pt-3 first:border-0 first:pt-0">
            <Row label={t("field.name")} value={t.name} />
            <Row label={t("field.confidence")} value={`${t.confidence}%`} mono />
            {t.version && <Row label={t("field.version")} value={t.version} mono />}
            <Row label={t("field.categories")} value={t.categories.join(", ")} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function CdnDetectionView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <Card title={t("module.cdnDetection")}>
      <div className="space-y-3 text-sm">
        <Row label={t("view.detected")} value={data.detected ? t("view.yes") : t("view.no")} mono />
        {data.provider && <Row label={t("view.provider")} value={data.provider} />}
        {data.cname && <Row label={t("field.cname")} value={data.cname} mono />}
        <Row label={t("view.evidence")} value={data.evidence.length > 0 ? data.evidence.join(", ") : t("view.none")} />
        <div className="pt-2">
          <span className="text-muted-foreground">{t("view.headers")}:</span>
          <div className="space-y-1 mt-1 text-xs mono">
            {Object.entries(data.headers).map(([k, v]) => (
              <div key={k} className="text-muted-foreground/70">{k}: {String(v)}</div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ReverseIpView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <Card title={t("view.reverseIpTitle", { n: data.domains.length, ip: data.ip })}>
      <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
        {data.domains.length === 0 ? (
          <span className="text-muted-foreground">{t("view.noDomains")}</span>
        ) : (
          data.domains.map((d: string, i: number) => (
            <Row key={i} label={d} value="" mono />
          ))
        )}
      </div>
    </Card>
  );
}

function TracerouteView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  if (data.hops.length === 0) {
    return <Card title={t("module.traceroute")}><span className="text-muted-foreground text-sm">{t("view.noHops")}</span></Card>;
  }

  return (
    <Card title={t("view.tracerouteTitle", { n: data.hops.length })}>
      <div className="space-y-2 text-sm font-mono">
        {data.hops.map((h: any) => (
          <div key={h.hop} className="flex gap-4">
            <span className="text-muted-foreground w-8">{h.hop}</span>
            <span className="w-32">{h.ip}</span>
            <span className="w-24">{h.rtt.toFixed(1)} ms</span>
            <span>{h.hostname || ""}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WaybackView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <Card title={t("view.waybackTitle", { n: data.total })}>
      <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
        {data.snapshots.length === 0 ? (
          <span className="text-muted-foreground">{t("view.noSnapshots")}</span>
        ) : (
          data.snapshots.slice(0, 50).map((s: any, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mono w-28">{s.timestamp}</span>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all mono text-xs">
                {s.url}
              </a>
            </div>
          ))
        )}
        {data.snapshots.length > 50 && (
          <p className="text-xs text-muted-foreground mt-2">{t("scan.showingFirst", { n: 50, total: data.snapshots.length })}</p>
        )}
      </div>
    </Card>
  );
}

function AxfrView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <Card title={t("view.axfrTitle")}>
      <div className="space-y-3 text-sm">
        <Row label={t("view.vulnerable")} value={data.vulnerable ? t("view.yes") : t("view.no")} mono />
        {data.nameservers.map((ns: any, i: number) => (
          <div key={i} className="border-t border-border pt-3 first:border-0 first:pt-0">
            <Row label={t("field.nameserver")} value={ns.ns} mono />
            <Row label={t("view.axfrAllowed")} value={ns.axfr ? t("view.yes") : t("view.no")} mono />
            {ns.axfr && ns.records && ns.records.length > 0 && (
              <div className="mt-2 space-y-1 text-xs mono">
                {ns.records.slice(0, 20).map((r: any, j: number) => (
                  <div key={j} className="text-muted-foreground/70 pl-4">{r.type} {r.value}</div>
                ))}
                {ns.records.length > 20 && <div className="text-muted-foreground/50 pl-4">{t("view.andMore", { n: ns.records.length - 20 })}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function EmailHarvestView({ data, error }: { data: any; error?: string }) {
  const { t } = useTranslation();
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const allEmails = [...new Set(data.emails as string[])];

  return (
    <Card title={t("view.emailHarvestTitle", { n: allEmails.length })}>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">{t("view.sources")}:</span>
          <div className="flex gap-4 mt-1 text-xs">
            <span>WHOIS: {data.sources.whois.length}</span>
            <span>TXT: {data.sources.txt.length}</span>
            <span>{t("view.other")}: {data.sources.other.length}</span>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {allEmails.length === 0 ? (
            <span className="text-muted-foreground">{t("view.noEmails")}</span>
          ) : (
            allEmails.map((e: string, i: number) => (
              <Row key={i} label={e} value="" mono />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-right break-all ${mono ? "mono text-xs" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}