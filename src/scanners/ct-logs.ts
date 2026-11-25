import type { CtLogsResult } from "@/lib/types";
import { assertSafeUrl } from "@/lib/safe-net";

const TIMEOUT = 30000;

export async function scanCtLogs(domain: string): Promise<CtLogsResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const url = `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`;
    await assertSafeUrl(url);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OSINT-Suite/1.0" },
    });

    if (!res.ok) throw new Error(`CT logs API returned HTTP ${res.status}`);

    const entries: CtLogEntry[] = await res.json();

    // Extract unique subdomains from name_value and subject_name fields.
    const subdomains = new Set<string>();
    for (const entry of entries) {
      for (const field of [entry.name_value, entry.subject_name]) {
        if (!field) continue;
        for (const line of field.split("\n")) {
          const normalized = line.trim().replace(/\.$/, "").toLowerCase();
          if (normalized && normalized !== domain) {
            subdomains.add(normalized);
          }
        }
      }
    }

    return { subdomains: Array.from(subdomains).sort() };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("CT logs lookup timeout");
    }
    throw new Error(`CT logs error: ${e instanceof Error ? e.message : "unknown"}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

interface CtLogEntry {
  name_value?: string;
  subject_name?: string;
}
