import { assertSafeUrl } from "@/lib/safe-net";

export interface WaybackSnapshot {
  url: string;
  timestamp: string;
}

export interface WaybackResult {
  snapshots: WaybackSnapshot[];
  total: number;
}

export async function scanWayback(target: string): Promise<WaybackResult> {
  const url = `http://web.archive.org/cdx/search/cdx?url=*.${encodeURIComponent(target)}/*&output=json&fl=original,timestamp&collapse=urlkey&limit=100`;
  await assertSafeUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OSINT-Suite/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { snapshots: [], total: 0 };
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) {
      return { snapshots: [], total: 0 };
    }

    // First row is header: ["original", "timestamp"]
    const rows = data.slice(1);
    const snapshots: WaybackSnapshot[] = rows.map((row: string[]) => ({
      url: row[0],
      timestamp: row[1],
    }));

    return { snapshots, total: snapshots.length };
  } catch {
    return { snapshots: [], total: 0 };
  }
}