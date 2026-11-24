"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle, Terminal, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateDomain = (d: string): boolean => {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(d);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = domain.trim().toLowerCase();
    if (!validateDomain(trimmed)) {
      setError("INVALID DOMAIN FORMAT");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: trimmed }),
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
            <label htmlFor="domain" className="label block mb-2">
              TARGET DOMAIN
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full pl-10 pr-4 py-3 border border-input bg-background/50 rounded text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50 mono"
                disabled={loading}
                autoFocus
                spellCheck={false}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 border border-destructive/30 bg-destructive/10 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="mono">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !domain.trim()}
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
              { icon: "🌐", label: "DNS Records" },
              { icon: "📄", label: "WHOIS" },
              { icon: "🔒", label: "SSL/TLS" },
              { icon: "📡", label: "HTTP Headers" },
              { icon: "🔌", label: "Port Scan" },
              { icon: "🔍", label: "Subdomains" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground/80 hover:text-foreground transition-colors">
                <span className="text-base">{m.icon}</span>
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