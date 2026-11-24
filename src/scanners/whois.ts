import { exec } from "child_process";
import { promisify } from "util";
import type { WhoisResult } from "@/lib/types";

const execAsync = promisify(exec);
const TIMEOUT = 10000;

export async function scanWhois(domain: string): Promise<WhoisResult> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("WHOIS timeout")), TIMEOUT)
  );

  try {
    const { stdout } = await Promise.race([
      execAsync(`whois ${domain}`),
      timeoutPromise,
    ]);

    return parseWhois(stdout);
  } catch (e) {
    // Fallback: try with --no-verbose for cleaner output
    try {
      const { stdout } = await Promise.race([
        execAsync(`whois --no-verbose ${domain}`),
        timeoutPromise,
      ]);
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