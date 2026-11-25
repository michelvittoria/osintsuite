import { assertSafeUrl } from "@/lib/safe-net";

export interface ReverseIpResult {
  ip: string;
  domains: string[];
}

export async function scanReverseIp(target: string, resolvedIp: string): Promise<ReverseIpResult> {
  const url = `https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(resolvedIp)}`;
  await assertSafeUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OSINT-Suite/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ip: resolvedIp, domains: [] };
    }

    const text = await res.text();
    const domains = text
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d && !d.startsWith("error") && !d.includes("API count exceeded"));

    return { ip: resolvedIp, domains };
  } catch {
    return { ip: resolvedIp, domains: [] };
  }
}