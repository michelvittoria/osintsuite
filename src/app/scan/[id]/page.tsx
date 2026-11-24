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
} from "lucide-react";
import type { JobState, ScanResult } from "@/lib/types";

const MODULE_LABELS: Record<string, string> = {
  dns: "DNS Records",
  whois: "WHOIS",
  ssl: "SSL/TLS",
  http: "HTTP Headers",
  ports: "Port Scan",
  subdomains: "Subdomains",
};

const MODULE_ICONS: Record<string, React.ReactNode> = {
  dns: <Globe className="h-4 w-4" />,
  whois: <FileText className="h-4 w-4" />,
  ssl: <Shield className="h-4 w-4" />,
  http: <Server className="h-4 w-4" />,
  ports: <Network className="h-4 w-4" />,
  subdomains: <Search className="h-4 w-4" />,
};

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dns");

  useEffect(() => {
    if (jobId === "cached") {
      setError("Cached result - please search again");
      return;
    }

    let cancelled = false;
    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/scan/${jobId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Scan not found or expired");
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
        if (!cancelled) setError("Connection error");
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
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Back to search
          </button>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const isDone = job.status === "done";
  const isError = job.status === "error";

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{job.domain}</h1>
            <p className="text-sm text-muted-foreground">
              {isDone ? "Scan complete" : isError ? "Scan failed" : "Scanning..."}
            </p>
          </div>
        </div>

        {isDone && (
          <div className="flex gap-2">
            <a
              href={`/api/export/${jobId}?format=json`}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              JSON
            </a>
            <a
              href={`/api/export/${jobId}?format=csv`}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              CSV
            </a>
          </div>
        )}
      </div>

      {/* Module progress */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {Object.entries(job.modules).map(([name, status]) => (
          <div
            key={name}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              status === "done"
                ? "border-green-500/30 bg-green-500/5"
                : status === "error"
                ? "border-destructive/30 bg-destructive/5"
                : status === "running"
                ? "border-blue-500/30 bg-blue-500/5"
                : "border-border"
            }`}
          >
            {status === "done" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : status === "error" ? (
              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            ) : status === "running" ? (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="truncate">{MODULE_LABELS[name] || name}</span>
          </div>
        ))}
      </div>

      {isError && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive mb-6">
          {job.error || "Scan failed"}
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
    { id: "ports", label: "Ports", data: result.modules.ports },
    { id: "subdomains", label: "Subdomains", data: result.modules.subdomains },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-foreground"
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
    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
      {error}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
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
        <div className="space-y-1 font-mono text-sm">
          {data.records.length === 0 && <span className="text-muted-foreground">No records</span>}
          {data.records.map((r: any, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground w-16">{r.type}</span>
              <span className="break-all">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Nameservers">
        <div className="space-y-1 font-mono text-sm">
          {data.nameservers.length === 0 && <span className="text-muted-foreground">None</span>}
          {data.nameservers.map((ns: string, i: number) => (
            <div key={i}>{ns}</div>
          ))}
        </div>
      </Card>

      <Card title="MX Records">
        <div className="space-y-1 font-mono text-sm">
          {data.mx.length === 0 && <span className="text-muted-foreground">None</span>}
          {data.mx.map((m: any, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground w-8">{m.priority}</span>
              <span className="break-all">{m.exchange}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="TXT Records">
        <div className="space-y-1 font-mono text-xs">
          {data.txt.length === 0 && <span className="text-muted-foreground">None</span>}
          {data.txt.map((t: string, i: number) => (
            <div key={i} className="break-all">{t}</div>
          ))}
        </div>
      </Card>

      {data.soa && (
        <Card title="SOA">
          <div className="space-y-1 font-mono text-sm">
            <div>NS: {data.soa.nsname}</div>
            <div>Hostmaster: {data.soa.hostmaster}</div>
            <div>Serial: {data.soa.serial}</div>
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
        <div className="space-y-1 font-mono text-sm">
          {data.nameservers.length === 0 && <span className="text-muted-foreground">None</span>}
          {data.nameservers.map((ns: string, i: number) => (
            <div key={i}>{ns}</div>
          ))}
        </div>
      </Card>

      <Card title="Status">
        <div className="space-y-1 text-sm">
          {data.status.length === 0 && <span className="text-muted-foreground">None</span>}
          {data.status.map((s: string, i: number) => (
            <div key={i} className="font-mono text-xs">{s}</div>
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Days Remaining</span>
            <span className={expiringSoon ? "text-destructive font-semibold" : "font-semibold"}>
              {data.daysRemaining}
            </span>
          </div>
        </div>
      </Card>

      <Card title={`SANs (${data.sans.length})`}>
        <div className="space-y-1 font-mono text-xs max-h-64 overflow-y-auto">
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
          <div className="space-y-1 font-mono text-xs">
            {data.redirects.map((r: string, i: number) => (
              <div key={i} className="break-all">
                {i + 1}. {r}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Headers">
        <div className="space-y-1 font-mono text-xs max-h-96 overflow-y-auto">
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
        <div className="space-y-1 font-mono text-sm">
          {open.length === 0 && <span className="text-muted-foreground">None</span>}
          {open.map((p: any) => (
            <div key={p.port} className="flex gap-3">
              <span className="text-green-500 w-12">{p.port}</span>
              <span className="text-muted-foreground">{p.service}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={`Closed/Filtered (${closed.length})`}>
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          {closed.map((p: any) => (
            <span key={p.port} className="px-2 py-1 bg-secondary rounded text-muted-foreground">
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
      <div className="space-y-1 font-mono text-sm">
        {data.length === 0 && <span className="text-muted-foreground">None found</span>}
        {data.map((s: any, i: number) => (
          <div key={i} className="flex gap-3">
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
      <span className={`text-right break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}