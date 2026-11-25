"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle, Terminal, ChevronRight, Globe, FileText, Shield, Radio, Plug, Search as SearchIcon, MapPin, GitBranch, FileKey, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
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
      setError("INVALID TARGET — ENTER A DOMAIN OR IPv4 ADDRESS");
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
        setError(data.error || "SCAN INIT FAILED");
        return;
      }

      router.push(`/scan/${data.jobId}`);
    } catch {
      setError("NETWORK ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none animate-sweep">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">OSINT SUITE</h1>
              <p className="label">DOMAIN RECONNAISSANCE TERMINAL</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          <div className="relative">
            <label htmlFor="target" className="label block mb-2">
              TARGET — DOMAIN OR IP
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                id="target"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="example.com or 8.8.8.8"
                className="w-full pl-10 pr-4 py-3 border border-input bg-background/50 rounded text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50 mono"
                disabled={loading}
                autoFocus
                spellCheck={false}
              />
            </div>
            {target.trim() && (
              <p className="mt-2 text-xs mono text-muted-foreground">
                DETECTED:{" "}
                <span className="text-primary">
                  {isIp ? "IPv4 ADDRESS" : isDomain ? "DOMAIN" : "UNKNOWN"}
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
            className="w-full py-3.5 bg-primary text-primary-foreground rounded font-medium text-lg transition-all hover:shadow-[0_0_24px_hsl(var(--signal)/0.4)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>INITIALIZING SCAN...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>START SCAN</span>
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Modules list */}
        <div className="mt-8 panel p-4">
          <p className="label mb-3">MODULES</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {[
              { Icon: Globe, label: "DNS Records" },
              { Icon: FileText, label: "WHOIS" },
              { Icon: Shield, label: "SSL/TLS" },
              { Icon: Radio, label: "HTTP Headers" },
              { Icon: Plug, label: "Port Scan" },
              { Icon: SearchIcon, label: "Subdomains" },
              { Icon: MapPin, label: "IP Geo" },
              { Icon: GitBranch, label: "CT Logs" },
              { Icon: FileKey, label: "security.txt" },
              { Icon: Bot, label: "robots.txt" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground/80 hover:text-foreground transition-colors">
                <m.Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="mono">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60 mono">
          RESULTS CACHED 24H • NO DATA STORED • STATIC ANALYSIS ONLY
        </p>
      </div>
    </main>
  );
}