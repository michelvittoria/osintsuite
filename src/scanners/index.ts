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
  | "robotsTxt";

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
];

export const IP_MODULES: ModuleName[] = [
  "dns",
  "whois",
  "ssl",
  "http",
  "ports",
  "ipGeo",
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

  const tasks: { name: ModuleName; fn: () => Promise<unknown> }[] =
    targetType === "ip"
      ? [
          { name: "dns", fn: () => resolvePTR(target) },
          { name: "whois", fn: () => scanWhois(target) },
          { name: "ssl", fn: () => scanSsl(target) },
          { name: "http", fn: () => scanHttp(target) },
          { name: "ports", fn: () => scanPorts(target) },
          { name: "ipGeo", fn: () => scanIpGeo(target) },
        ]
      : [
          { name: "dns", fn: () => scanDns(target) },
          { name: "whois", fn: () => scanWhois(target) },
          { name: "ssl", fn: () => scanSsl(target) },
          { name: "http", fn: () => scanHttp(target) },
          { name: "ports", fn: () => scanPorts(target) },
          { name: "subdomains", fn: () => scanSubdomains(target) },
          { name: "ctLogs", fn: () => scanCtLogs(target) },
          { name: "securityTxt", fn: () => scanSecurityTxt(target) },
          { name: "robotsTxt", fn: () => scanRobotsTxt(target) },
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