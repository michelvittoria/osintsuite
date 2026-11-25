import type { RobotsTxtResult } from "@/lib/types";
import { assertSafeUrl } from "@/lib/safe-net";

const TIMEOUT = 5000;

export async function scanRobotsTxt(domain: string): Promise<RobotsTxtResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const url = `https://${domain}/robots.txt`;
    await assertSafeUrl(url);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OSINT-Suite/1.0" },
    });

    if (!res.ok) {
      return { exists: false, disallow: [], allow: [], sitemaps: [], raw: "" };
    }

    const raw = await res.text();
    const parsed = parseRobotsTxt(raw);

    return { ...parsed, raw };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("robots.txt lookup timeout");
    }
    return { exists: false, disallow: [], allow: [], sitemaps: [], raw: "" };
  } finally {
    clearTimeout(timeoutId);
  }
}

interface ParsedRobots {
  exists: boolean;
  disallow: string[];
  allow: string[];
  sitemaps: string[];
  crawlDelay?: number;
}

/** Minimal robots.txt parser. */
function parseRobotsTxt(raw: string): ParsedRobots {
  const disallow: string[] = [];
  const allow: string[] = [];
  const sitemaps: string[] = [];
  let crawlDelay: number | undefined;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();

    switch (key) {
      case "disallow":
        if (value) disallow.push(value);
        break;
      case "allow":
        if (value) allow.push(value);
        break;
      case "sitemap":
        sitemaps.push(value);
        break;
      case "crawl-delay": {
        const n = Number(value);
        if (!isNaN(n)) crawlDelay = n;
        break;
      }
    }
  }

  return { exists: true, disallow, allow, sitemaps, crawlDelay };
}
