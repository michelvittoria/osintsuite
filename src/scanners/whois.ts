import { spawn } from "child_process";
import type { WhoisResult } from "@/lib/types";

const TIMEOUT = 10000;

function runWhois(domain: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // spawn with arg array — no shell, no command injection possible.
    const proc = spawn("whois", args, { shell: false });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill("SIGKILL");
      reject(new Error("WHOIS timeout"));
    }, TIMEOUT);

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `whois exited with code ${code}`));
    });
  });
}

export async function scanWhois(domain: string): Promise<WhoisResult> {
  try {
    const stdout = await runWhois(domain, [domain]);
    return parseWhois(stdout);
  } catch {
    // Fallback: try with --no-verbose for cleaner output
    try {
      const stdout = await runWhois(domain, ["--no-verbose", domain]);
      return parseWhois(stdout);
    } catch {
      throw new Error("WHOIS lookup failed");
    }
  }
}

function parseWhois(raw: string): WhoisResult {
  const lines = raw.split("\n").map((l) => l.trim());

  const registrar = extractField(lines, ["registrar", "sponsoring registrar"]);
  const createdDate = extractField(lines, ["creation date", "created"]);
  const updatedDate = extractField(lines, ["updated date", "last modified"]);
  const expiryDate = extractField(lines, ["expiry date", "registry expiry date", "expires"]);
  const status = extractMultiField(lines, ["status"]);

  const nameservers = extractMultiField(lines, ["nameserver", "ns"]).map(
    (n) => n.replace(/^NS:\s*/i, "")
  );

  const registrant = extractField(lines, [
    "registrant name",
    "name:",
    "org name",
  ]);

  return {
    registrar: registrar || undefined,
    registrant: registrant || undefined,
    createdDate: createdDate || undefined,
    updatedDate: updatedDate || undefined,
    expiryDate: expiryDate || undefined,
    nameservers,
    status,
    raw: raw.substring(0, 2000),
  };
}

function extractField(lines: string[], fields: string[]): string | null {
  for (const line of lines) {
    for (const field of fields) {
      if (line.toLowerCase().startsWith(`${field}:`) || line.toLowerCase().startsWith(`${field} `)) {
        const value = line.split(/[:\s]+/, 2).slice(1).join(" ").trim();
        if (value && value !== "not defined") return value;
      }
    }
  }
  return null;
}

function extractMultiField(lines: string[], fields: string[]): string[] {
  const results: string[] = [];
  for (const line of lines) {
    for (const field of fields) {
      if (line.toLowerCase().startsWith(`${field}:`) || line.toLowerCase().startsWith(`${field} `)) {
        const value = line.split(/[:\s]+/, 2).slice(1).join(" ").trim();
        if (value && value !== "not defined") results.push(value);
      }
    }
  }
  return results;
}