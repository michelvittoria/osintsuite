import type { IpGeoResult } from "@/lib/types";

const TIMEOUT = 5000;

const FIELDS = [
  "status",
  "message",
  "country",
  "countryCode",
  "regionName",
  "city",
  "isp",
  "org",
  "as",
  "timezone",
  "query",
].join(",");

interface IpApiResponse {
  status: "success" | "fail";
  message?: string;
  country?: string;
  countryCode?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  org?: string;
  as?: string;
  timezone?: string;
  query?: string;
}

export async function scanIpGeo(ip: string): Promise<IpGeoResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    // ip-api.com free tier is HTTP-only (no HTTPS on the free plan).
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${FIELDS}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OSINT-Suite/1.0" },
    });

    if (!res.ok) {
      throw new Error(`Geo lookup failed: HTTP ${res.status}`);
    }

    const data = (await res.json()) as IpApiResponse;

    if (data.status !== "success") {
      throw new Error(data.message || "Geo lookup failed");
    }

    return {
      query: data.query || ip,
      country: data.country,
      countryCode: data.countryCode,
      regionName: data.regionName,
      city: data.city,
      isp: data.isp,
      org: data.org,
      asn: data.as,
      timezone: data.timezone,
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Geo lookup timeout");
    }
    throw new Error(`Geo lookup error: ${e instanceof Error ? e.message : "unknown"}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
