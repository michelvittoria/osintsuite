import { resolve } from "dns/promises";
import { assertSafeUrl } from "@/lib/safe-net";

export interface AsnLookupResult {
  asns: { ip: string; asn: string; org: string; isp: string }[];
}

const IP_API_URL = "http://ip-api.com/batch";

async function resolveA(hostname: string): Promise<string[]> {
  try {
    return await resolve(hostname, "A");
  } catch {
    return [];
  }
}

export async function scanAsnLookup(target: string): Promise<AsnLookupResult> {
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);
  let ips: string[] = [];

  if (isIp) {
    ips = [target];
  } else {
    ips = await resolveA(target);
    if (ips.length === 0) return { asns: [] };
  }

  const uniqueIps = Array.from(new Set(ips)).slice(0, 10);

  const url = `${IP_API_URL}?fields=query,as,isp,org`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    await assertSafeUrl(url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uniqueIps),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return { asns: [] };

    const data = await res.json();
    const asns = data
      .filter((r: any) => r.as)
      .map((r: any) => ({
        ip: r.query,
        asn: r.as.split(" ")[0],
        org: r.org || "",
        isp: r.isp || "",
      }));

    return { asns };
  } catch {
    return { asns: [] };
  }
}