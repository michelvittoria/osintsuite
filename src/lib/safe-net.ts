import dns from "dns/promises";
import net from "net";

/**
 * SSRF guard: resolve a hostname and reject if any resolved address is
 * private, loopback, link-local, CGNAT, multicast, reserved or unspecified.
 * Returns the validated public IPs so callers can connect to the IP directly
 * (prevents DNS rebinding between check and connect).
 */

const BLOCKED_V4 = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // CGNAT 100.64/10
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.0\.0\./,
  /^192\.0\.2\./,
  /^192\.168\./,
  /^198\.(1[89])\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^22[4-9]\./,
  /^23[0-9]\./,
  /^24[0-9]\./,
  /^25[0-5]\./,
];

const BLOCKED_V6 = [
  /^::$/,
  /^::1$/,
  /^::ffff:/i, // IPv4-mapped
  /^fe80:/i, // link-local
  /^f[cd][0-9a-f]{2}:/i, // unique local fc00::/7
  /^ff[0-9a-f]{2}:/i, // multicast
  /^2001:db8:/i, // documentation
];

export function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return BLOCKED_V4.some((re) => re.test(ip));
  if (version === 6) {
    const normalized = ip.toLowerCase();
    return BLOCKED_V6.some((re) => re.test(normalized));
  }
  return true; // not a valid IP -> block
}

export interface ResolvedTarget {
  host: string;
  ips: string[];
}

/**
 * Resolve host and return only if every address is public.
 * Throws on private/reserved addresses or resolution failure.
 */
export async function resolvePublicHost(host: string): Promise<ResolvedTarget> {
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error(`Blocked address: ${host}`);
    return { host, ips: [host] };
  }

  const [v4, v6] = await Promise.all([
    dns.resolve4(host).catch(() => [] as string[]),
    dns.resolve6(host).catch(() => [] as string[]),
  ]);
  const ips = [...v4, ...v6];

  if (ips.length === 0) throw new Error(`DNS resolution failed: ${host}`);

  for (const ip of ips) {
    if (isBlockedIp(ip)) throw new Error(`Blocked private address: ${ip}`);
  }

  return { host, ips };
}

/**
 * Validate a URL for outbound fetching. Rejects non-http(s) schemes and
 * hosts that resolve to private/reserved addresses.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Blocked protocol: ${url.protocol}`);
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  await resolvePublicHost(host);
  return url;
}
