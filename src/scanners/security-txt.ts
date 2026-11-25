import type { SecurityTxtResult } from "@/lib/types";
import { assertSafeUrl } from "@/lib/safe-net";

const TIMEOUT = 5000;

export async function scanSecurityTxt(domain: string): Promise<SecurityTxtResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const url = `https://${domain}/.well-known/security.txt`;
    await assertSafeUrl(url);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OSINT-Suite/1.0" },
    });

    if (!res.ok) {
      return { exists: false, raw: "" };
    }

    const raw = await res.text();
    const fields = parseSecurityTxt(raw);

    return {
      exists: true,
      contact: fields.contact,
      expires: fields.expires,
      encryption: fields.encryption,
      acknowledgments: fields.acknowledgments,
      policy: fields.policy,
      preferredLanguages: fields["preferred-languages"]?.split(",").map((s) => s.trim()) || undefined,
      canonical: fields.canonical,
      raw,
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("security.txt lookup timeout");
    }
    // Network error → treat as not found
    return { exists: false, raw: "" };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Parse RFC 9116 security.txt key-value pairs. */
function parseSecurityTxt(raw: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let currentKey = "";

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Continuation line (starts with space/tab)
    if (/^\s/.test(line) && currentKey) {
      fields[currentKey] += "\n" + trimmed;
      continue;
    }

    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;

    currentKey = trimmed.slice(0, idx).toLowerCase().trim();
    fields[currentKey] = trimmed.slice(idx + 1).trim();
  }

  return fields;
}
