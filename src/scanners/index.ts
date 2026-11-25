import type { ScanResult, ModuleStatus, TargetType } from "@/lib/types";
import { scanDns, resolvePTR } from "./dns";
import { scanWhois } from "./whois";
import { scanSsl } from "./ssl";
import { scanHttp } from "./http";
import { scanPorts } from "./ports";
import { scanSubdomains } from "./subdomains";
import { scanIpGeo } from "./ip-geo";
import { scanCtLogs } from "./ct-logs";
import { scanSecurityTxt } from "./security-txt";
import { scanRobotsTxt } from "./robots-txt";
import { scanDnssec } from "./dnssec";
import { scanEmailSecurity } from "./email-security";
import { scanAsnLookup } from "./asn-lookup";
import { scanTechFingerprint } from "./tech-fingerprint";
import { scanCdnDetection } from "./cdn-detection";
import { scanReverseIp } from "./reverse-ip";
import { scanTraceroute } from "./traceroute";
import { scanWayback } from "./wayback";
import { scanAxfr } from "./axfr";
import { scanEmailHarvest } from "./email-harvest";

export type ModuleName =
  | "dns"
  | "whois"
  | "ssl"
  | "http"
  | "ports"
  | "subdomains"
  | "ipGeo"
  | "ctLogs"
  | "securityTxt"
  | "robotsTxt"
  | "dnssec"
  | "emailSecurity"
  | "asnLookup"
  | "techFingerprint"
  | "cdnDetection"
  | "reverseIp"
  | "traceroute"
  | "wayback"
  | "axfr"
  | "emailHarvest";

export const MODULES: ModuleName[] = [
  "dns",
  "whois",
  "ssl",
  "http",
  "ports",
  "subdomains",
  "ctLogs",
  "securityTxt",
  "robotsTxt",
  "dnssec",
  "emailSecurity",
  "asnLookup",
  "techFingerprint",
  "cdnDetection",
  "reverseIp",
  "traceroute",
  "wayback",
  "axfr",
  "emailHarvest",
];

export const IP_MODULES: ModuleName[] = [
  "dns",
  "whois",
  "ssl",
  "http",
  "ports",
  "ipGeo",
  "traceroute",
  "reverseIp",
  "cdnDetection",
  "wayback",
];

export type ProgressCallback = (module: ModuleName, status: ModuleStatus) => void;

function emptyModules(modules: ModuleName[]): Record<string, null> {
  return Object.fromEntries(modules.map((m) => [m, null]));
}

export async function runScan(
  target: string,
  targetType: TargetType = "domain",
  onProgress?: ProgressCallback
): Promise<ScanResult> {
  const activeModules = targetType === "ip" ? IP_MODULES : MODULES;

  const result: ScanResult = {
    domain: target,
    targetType,
    scannedAt: new Date().toISOString(),
    cached: false,
    modules: emptyModules(activeModules) as ScanResult["modules"],
    errors: {},
  };

  // Shared data for modules that depend on each other
  let dnsData: Awaited<ReturnType<typeof scanDns>> | null = null;
  let httpData: Awaited<ReturnType<typeof scanHttp>> | null = null;
  let whoisData: Awaited<ReturnType<typeof scanWhois>> | null = null;
  let resolvedIp: string | null = null;

  const tasks: { name: ModuleName; fn: () => Promise<unknown> }[] =
    targetType === "ip"
      ? [
          { name: "dns", fn: async () => { dnsData = await resolvePTR(target); return dnsData; } },
          { name: "whois", fn: async () => { whoisData = await scanWhois(target); return whoisData; } },
          { name: "ssl", fn: () => scanSsl(target) },
          { name: "http", fn: async () => { httpData = await scanHttp(target); return httpData; } },
          { name: "ports", fn: () => scanPorts(target) },
          { name: "ipGeo", fn: () => scanIpGeo(target) },
          { name: "traceroute", fn: () => scanTraceroute(target) },
          { name: "reverseIp", fn: async () => {
              if (!dnsData?.records[0]?.value) return { ip: target, domains: [] };
              resolvedIp = dnsData.records[0].value;
              return scanReverseIp(target, resolvedIp);
            } },
          { name: "cdnDetection", fn: async () => scanCdnDetection(httpData, dnsData) },
          { name: "wayback", fn: () => scanWayback(target) },
        ]
      : [
          { name: "dns", fn: async () => { dnsData = await scanDns(target); return dnsData; } },
          { name: "whois", fn: async () => { whoisData = await scanWhois(target); return whoisData; } },
          { name: "ssl", fn: () => scanSsl(target) },
          { name: "http", fn: async () => { httpData = await scanHttp(target); return httpData; } },
          { name: "ports", fn: () => scanPorts(target) },
          { name: "subdomains", fn: () => scanSubdomains(target) },
          { name: "ctLogs", fn: () => scanCtLogs(target) },
          { name: "securityTxt", fn: () => scanSecurityTxt(target) },
          { name: "robotsTxt", fn: () => scanRobotsTxt(target) },
          { name: "dnssec", fn: () => scanDnssec(target) },
          { name: "emailSecurity", fn: () => scanEmailSecurity(target) },
          { name: "asnLookup", fn: () => scanAsnLookup(target) },
          { name: "techFingerprint", fn: async () => scanTechFingerprint(httpData) },
          { name: "cdnDetection", fn: async () => scanCdnDetection(httpData, dnsData) },
          { name: "reverseIp", fn: async () => {
              if (!dnsData?.records[0]?.value) return { ip: target, domains: [] };
              resolvedIp = dnsData.records[0].value;
              return scanReverseIp(target, resolvedIp);
            } },
          { name: "traceroute", fn: () => scanTraceroute(target) },
          { name: "wayback", fn: () => scanWayback(target) },
          { name: "axfr", fn: async () => scanAxfr(target, dnsData?.nameservers || []) },
          { name: "emailHarvest", fn: async () => scanEmailHarvest(whoisData, dnsData, httpData?.finalUrl, httpData?.title) },
        ];

  await Promise.all(
    tasks.map(async ({ name, fn }) => {
      onProgress?.(name, "running");
      try {
        const data = await fn();
        (result.modules as Record<string, unknown>)[name] = data;
        onProgress?.(name, "done");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown error";
        result.errors[name] = msg;
        onProgress?.(name, "error");
      }
    })
  );

  return result;
}