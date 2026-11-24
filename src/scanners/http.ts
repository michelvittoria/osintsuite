import type { HttpResult } from "@/lib/types";
import { assertSafeUrl } from "@/lib/safe-net";

const TIMEOUT = 10000;
const MAX_REDIRECTS = 10;

export async function scanHttp(domain: string): Promise<HttpResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  const redirects: string[] = [];
  let currentUrl = `https://${domain}`;
  let finalResponse: Response | null = null;

  try {
    for (let i = 0; i < MAX_REDIRECTS; i++) {
      // SSRF guard: validate every hop (initial + each redirect target).
      await assertSafeUrl(currentUrl);

      const res = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "OSINT-Suite/1.0",
        },
      });

      finalResponse = res;
      redirects.push(currentUrl);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      break;
    }

    if (!finalResponse) {
      throw new Error("No response received");
    }

    const headers: Record<string, string> = {};
    finalResponse.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let title: string | undefined;
    try {
      const html = await finalResponse.text();
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match) title = match[1].trim();
    } catch {
      // ignore
    }

    return {
      status: finalResponse.status,
      statusText: finalResponse.statusText,
      server: finalResponse.headers.get("server") || undefined,
      headers,
      redirects,
      finalUrl: currentUrl,
      title,
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("HTTP timeout");
    }
    throw new Error(`HTTP error: ${e instanceof Error ? e.message : "unknown"}`);
  } finally {
    clearTimeout(timeoutId);
  }
}