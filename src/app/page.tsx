"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle } from "lucide-react";
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
      setError("Invalid domain format");
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
        setError(data.error || "Failed to start scan");
        return;
      }

      router.push(`/scan/${data.jobId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            OSINT Suite
          </h1>
          <p className="text-muted-foreground text-lg">
            Domain intelligence & reconnaissance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-lg text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting scan...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Start Scan
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          <p>Scans: DNS, WHOIS, SSL, HTTP, Ports, Subdomains</p>
          <p className="mt-1">Results cached for 24h • No data stored</p>
        </div>
      </div>
    </main>
  );
}