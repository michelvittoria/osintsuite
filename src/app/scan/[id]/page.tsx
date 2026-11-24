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
} from "lucide-react";
import type { JobState, ScanResult } from "@/lib/types";

const MODULE_LABELS: Record<string, string> = {
  dns: "DNS",
  whois: "WHOIS",
  ssl: "SSL/TLS",
  http: "HTTP",
  ports: "PORTS",
  subdomains: "SUBDOMAINS",
};

const MODULE_ICONS: Record<string, React.ReactNode> = {
  dns: <Globe className="h-3.5 w-3.5" />,
  whois: <FileText className="h-3.5 w-3.5" />,
  ssl: <Shield className="h-3.5 w-3.5" />,
  http: <Server className="h-3.5 w-3.5" />,
  ports: <Network className="h-3.5 w-3.5" />,
  subdomains: <Search className="h-3.5 w-3.5" />,
};

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

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
            setError("SCAN NOT FOUND OR EXPIRED");
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
        if (!cancelled) setError("CONNECTION ERROR");
      }
    };

    poll();
    interval = setInterval(poll, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center panel p-8 max-w-md">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">SCAN ERROR</h1>
          <p className="text-muted-foreground mb-6 mono text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium hover:shadow-[0_0_20px_hsl(var(--signal)/0.4)] transition-all"
          >
            BACK TO SEARCH
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
          <p className="label">CONNECTING...</p>
        </div>
      </main>
    );
  }

  const isDone = job.status === "done";
  const isError = job.status === "error";
  const doneCount = Object.values(job.modules).filter((s) => s === "done").length;
  const totalCount = Object.keys(job.modules).length;

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 border border-border hover:border-primary/50 hover:bg-secondary rounded transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="label">TARGET</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{job.domain}</h1>
            <p className="text-xs text-muted-foreground mono mt-1">
              {isDone
                ? `SCAN COMPLETE — ${doneCount}/${totalCount} MODULES`
                : isError
                ? "SCAN FAILED"
                : `SCANNING — ${doneCount}/${totalCount} MODULES`}
            </p>
          </div>
        </div>

        {isDone && (
          <div className="flex gap-2">
            <a
              href={`/api/export/${jobId}?format=json`}
              className="flex items-center gap-2 px-3 py-2 border border-border hover:border-primary/50 hover:bg-secondary rounded text-xs mono transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              JSON
            </a>
            <a
              href={`/api/export/${jobId}?format=csv`}
              className="flex items-center gap-2 px-3 py-2 border border-border hover:border-primary/50 hover:bg-secondary rounded text-xs mono transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
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
              <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
            ) : status === "running" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{MODULE_LABELS[name] || name}</span>
          </div>
        ))}
      </div>

      {isError && (
        <div className="p-4 border border-destructive/30 bg-destructive/10 rounded text-destructive mb-6 mono text-sm">
          {job.error || "SCAN FAILED"}
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
  const tabs = [
    { id: "dns", label: "DNS", data: result.modules.dns },
    { id: "whois", label: "WHOIS", data: result.modules.whois },
    { id: "ssl", label: "SSL", data: result.modules.ssl },
    { id: "http", label: "HTTP", data: result.modules.http },
    { id: "ports", label: "PORTS", data: result.modules.ports },
    { id: "subdomains", label: "SUBDOMAINS", data: result.modules.subdomains },
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
              <XCircle className="h-3 w-3 text-destructive" />
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
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="A / AAAA / CNAME">
        <div className="space-y-1.5 mono text-sm">
          {data.records.length === 0 && <span className="text-muted-foreground">NO RECORDS</span>}
          {data.records.map((r: any, i: number) => (
            <div key={i} className="flex gap-3">
              <span className="text-primary w-14 flex-shrink-0">{r.type}</span>
              <span className="break-all">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Nameservers">
        <div className="space-y-1.5 mono text-sm">
          {data.nameservers.length === 0 && <span className="text-muted-foreground">NONE</span>}
          {data.nameservers.map((ns: string, i: number) => (
            <div key={i} className="break-all">{ns}</div>
          ))}
        </div>
      </Card>

      <Card title="MX Records">
        <div className="space-y-1.5 mono text-sm">
          {data.mx.length === 0 && <span className="text-muted-foreground">NONE</span>}
          {data.mx.map((m: any, i: number) => (
            <div key={i} className="flex gap-3">
              <span className="text-primary w-8 flex-shrink-0">{m.priority}</span>
              <span className="break-all">{m.exchange}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="TXT Records">
        <div className="space-y-1.5 mono text-xs">
          {data.txt.length === 0 && <span className="text-muted-foreground">NONE</span>}
          {data.txt.map((t: string, i: number) => (
            <div key={i} className="break-all">{t}</div>
          ))}
        </div>
      </Card>

      {data.soa && (
        <Card title="SOA">
          <div className="space-y-1.5 mono text-sm">
            <Row label="NS" value={data.soa.nsname} />
            <Row label="Hostmaster" value={data.soa.hostmaster} />
            <Row label="Serial" value={String(data.soa.serial)} />
          </div>
        </Card>
      )}
    </div>
  );
}

function WhoisView({ data, error }: { data: any; error?: string }) {
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Registration">
        <div className="space-y-2 text-sm">
          <Row label="Registrar" value={data.registrar} />
          <Row label="Registrant" value={data.registrant} />
          <Row label="Created" value={data.createdDate} />
          <Row label="Updated" value={data.updatedDate} />
          <Row label="Expiry" value={data.expiryDate} />
        </div>
      </Card>

      <Card title="Nameservers">
        <div className="space-y-1.5 mono text-sm">
          {data.nameservers.length === 0 && <span className="text-muted-foreground">NONE</span>}
          {data.nameservers.map((ns: string, i: number) => (
            <div key={i} className="break-all">{ns}</div>
          ))}
        </div>
      </Card>

      <Card title="Status">
        <div className="space-y-1 text-sm">
          {data.status.length === 0 && <span className="text-muted-foreground">NONE</span>}
          {data.status.map((s: string, i: number) => (
            <div key={i} className="mono text-xs break-all">{s}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SslView({ data, error }: { data: any; error?: string }) {
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const expiringSoon = data.daysRemaining < 30;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Certificate">
        <div className="space-y-2 text-sm">
          <Row label="Subject" value={data.subject} />
          <Row label="Issuer" value={data.issuer} />
          <Row label="Protocol" value={data.protocol} />
          <Row label="Serial" value={data.serialNumber} mono />
        </div>
      </Card>

      <Card title="Validity">
        <div className="space-y-2 text-sm">
          <Row label="Valid From" value={new Date(data.validFrom).toLocaleString()} />
          <Row label="Valid To" value={new Date(data.validTo).toLocaleString()} />
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground flex-shrink-0">Days Remaining</span>
            <span className={`mono font-semibold ${expiringSoon ? "text-destructive" : "text-primary"}`}>
              {data.daysRemaining}
            </span>
          </div>
        </div>
      </Card>

      <Card title={`SANs (${data.sans.length})`}>
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
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Response">
        <div className="space-y-2 text-sm">
          <Row label="Status" value={`${data.status} ${data.statusText}`} />
          <Row label="Server" value={data.server} />
          <Row label="Final URL" value={data.finalUrl} mono />
          <Row label="Title" value={data.title} />
        </div>
      </Card>

      {data.redirects.length > 1 && (
        <Card title="Redirect Chain">
          <div className="space-y-1 mono text-xs">
            {data.redirects.map((r: string, i: number) => (
              <div key={i} className="break-all">
                <span className="text-primary">{i + 1}.</span> {r}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Headers">
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
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const open = data.filter((p: any) => p.open);
  const closed = data.filter((p: any) => !p.open);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={`Open Ports (${open.length})`}>
        <div className="space-y-1.5 mono text-sm">
          {open.length === 0 && <span className="text-muted-foreground">NONE</span>}
          {open.map((p: any) => (
            <div key={p.port} className="flex gap-3">
              <span className="text-primary w-12 flex-shrink-0">{p.port}</span>
              <span className="text-muted-foreground">{p.service}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={`Closed / Filtered (${closed.length})`}>
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
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <Card title={`Found ${data.length} subdomains`}>
      <div className="space-y-1.5 mono text-sm">
        {data.length === 0 && <span className="text-muted-foreground">NONE FOUND</span>}
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