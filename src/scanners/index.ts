import type { ScanResult, ModuleStatus } from "@/lib/types";
import { scanDns } from "./dns";
import { scanWhois } from "./whois";
import { scanSsl } from "./ssl";
import { scanHttp } from "./http";
import { scanPorts } from "./ports";
import { scanSubdomains } from "./subdomains";

export type ModuleName = "dns" | "whois" | "ssl" | "http" | "ports" | "subdomains";

export const MODULES: ModuleName[] = ["dns", "whois", "ssl", "http", "ports", "subdomains"];

export type ProgressCallback = (module: ModuleName, status: ModuleStatus) => void;

export async function runScan(
  domain: string,
  onProgress?: ProgressCallback
): Promise<ScanResult> {
  const result: ScanResult = {
    domain,
    scannedAt: new Date().toISOString(),
    cached: false,
    modules: {
      dns: null,
      whois: null,
      ssl: null,
      http: null,
      ports: null,
      subdomains: null,
    },
    errors: {},
  };

  const tasks: { name: ModuleName; fn: () => Promise<unknown> }[] = [
    { name: "dns", fn: () => scanDns(domain) },
    { name: "whois", fn: () => scanWhois(domain) },
    { name: "ssl", fn: () => scanSsl(domain) },
    { name: "http", fn: () => scanHttp(domain) },
    { name: "ports", fn: () => scanPorts(domain) },
    { name: "subdomains", fn: () => scanSubdomains(domain) },
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