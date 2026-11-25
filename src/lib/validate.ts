import { isIP } from "net";

const DOMAIN_REGEX = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;

const BLOCKED_TLDS = ["local", "localhost", "internal", "test", "example", "invalid"];

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^127\./,
  /^169\.254\./,
  /^::1$/,
  /^fe80::/i,
  /^fc00::/i,
  /^fd00::/i,
];

export function validateDomain(input: string): { valid: boolean; domain?: string; error?: string } {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: "Domain is required" };
  }

  if (trimmed.length > 253) {
    return { valid: false, error: "Domain too long" };
  }

  if (isIP(trimmed)) {
    return { valid: false, error: "IP addresses not allowed" };
  }

  if (!DOMAIN_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid domain format" };
  }

  const tld = trimmed.split(".").pop() || "";
  if (BLOCKED_TLDS.includes(tld)) {
    return { valid: false, error: "Blocked TLD" };
  }

  const labels = trimmed.split(".");
  for (const label of labels) {
    if (label.length > 63) {
      return { valid: false, error: "Label too long" };
    }
    if (label.startsWith("-") || label.endsWith("-")) {
      return { valid: false, error: "Invalid label format" };
    }
  }

  return { valid: true, domain: trimmed };
}

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((regex) => regex.test(ip));
}

export function validateIp(input: string): { valid: boolean; ip?: string; error?: string } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, error: "IP address is required" };
  }

  if (isIP(trimmed) !== 4) {
    return { valid: false, error: "Invalid IPv4 address" };
  }

  if (isPrivateIp(trimmed)) {
    return { valid: false, error: "Private IP ranges not allowed" };
  }

  return { valid: true, ip: trimmed };
}

export type DetectedTarget =
  | { type: "domain"; valid: true; domain: string }
  | { type: "ip"; valid: true; ip: string }
  | { type: "domain" | "ip"; valid: false; error: string };

export function detectTarget(input: string): DetectedTarget {
  const trimmed = input.trim();

  if (!trimmed) {
    return { type: "domain", valid: false, error: "Target is required" };
  }

  // IPv4 literal → route to IP validation.
  if (isIP(trimmed) === 4) {
    const ipResult = validateIp(trimmed);
    if (!ipResult.valid) {
      return { type: "ip", valid: false, error: ipResult.error! };
    }
    return { type: "ip", valid: true, ip: ipResult.ip! };
  }

  // Anything else is treated as a domain.
  const domainResult = validateDomain(trimmed);
  if (!domainResult.valid) {
    return { type: "domain", valid: false, error: domainResult.error! };
  }
  return { type: "domain", valid: true, domain: domainResult.domain! };
}

export async function resolveAndGuard(domain: string): Promise<{ safe: boolean; ips: string[]; error?: string }> {
  const dns = await import("dns/promises");
  try {
    const addresses = await dns.resolve4(domain);
    const ipv6 = await dns.resolve6(domain).catch(() => []);
    const allIps = [...addresses, ...ipv6];

    for (const ip of allIps) {
      if (isPrivateIp(ip)) {
        return { safe: false, ips: allIps, error: `Blocked private IP: ${ip}` };
      }
    }

    return { safe: true, ips: allIps };
  } catch (e) {
    return { safe: false, ips: [], error: `DNS resolution failed: ${e}` };
  }
}