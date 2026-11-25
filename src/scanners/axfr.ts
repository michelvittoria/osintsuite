import { spawn } from "child_process";
import type { DnsRecord } from "@/lib/types";

export interface AxfrNameserverResult {
  ns: string;
  axfr: boolean;
  records?: DnsRecord[];
  error?: string;
}

export interface AxfrResult {
  vulnerable: boolean;
  nameservers: AxfrNameserverResult[];
}

function parseDigOutput(output: string): DnsRecord[] {
  const records: DnsRecord[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith(";") || line.trim() === "") continue;

    // Match standard DNS record format: name TTL class type value
    const match = line.match(/^(\S+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
    if (match) {
      const [, name, ttl, , type, value] = match;
      records.push({ type, value: value.trim(), ttl: parseInt(ttl, 10) });
    }
  }

  return records;
}

async function tryAxfr(ns: string, domain: string): Promise<AxfrNameserverResult> {
  return new Promise((resolve) => {
    try {
      const proc = spawn("dig", ["AXFR", `@${ns}`, domain]);

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const timer = setTimeout(() => {
        proc.kill("SIGTERM");
        resolve({ ns, axfr: false, error: "timeout" });
      }, 15000);

      proc.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0 && stdout.includes("XFR size:")) {
          const records = parseDigOutput(stdout);
          resolve({ ns, axfr: true, records });
        } else {
          // AXFR refused or failed - not an error, just not vulnerable
          resolve({ ns, axfr: false, error: stderr || "refused" });
        }
      });

      proc.on("error", () => {
        clearTimeout(timer);
        resolve({ ns, axfr: false, error: "spawn failed" });
      });
    } catch {
      resolve({ ns, axfr: false, error: "exception" });
    }
  });
}

export async function scanAxfr(target: string, nameservers: string[]): Promise<AxfrResult> {
  const results: AxfrNameserverResult[] = [];
  let vulnerable = false;

  for (const ns of nameservers) {
    const result = await tryAxfr(ns, target);
    if (result.axfr) vulnerable = true;
    results.push(result);
  }

  return { vulnerable, nameservers: results };
}