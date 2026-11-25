import dns from "dns/promises";
import type { DnsResult, DnsRecord } from "@/lib/types";

const TIMEOUT = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export async function scanDns(domain: string): Promise<DnsResult> {
  const records: DnsRecord[] = [];

  const [a, aaaa, mx, txt, cname, ns, soa] = await Promise.allSettled([
    withTimeout(dns.resolve4(domain), TIMEOUT),
    withTimeout(dns.resolve6(domain), TIMEOUT),
    withTimeout(dns.resolveMx(domain), TIMEOUT),
    withTimeout(dns.resolveTxt(domain), TIMEOUT),
    withTimeout(dns.resolveCname(domain), TIMEOUT),
    withTimeout(dns.resolveNs(domain), TIMEOUT),
    withTimeout(dns.resolveSoa(domain), TIMEOUT),
  ]);

  if (a.status === "fulfilled") {
    a.value.forEach((ip) => records.push({ type: "A", value: ip }));
  }
  if (aaaa.status === "fulfilled") {
    aaaa.value.forEach((ip) => records.push({ type: "AAAA", value: ip }));
  }
  if (cname.status === "fulfilled") {
    cname.value.forEach((c) => records.push({ type: "CNAME", value: c }));
  }

  const mxList =
    mx.status === "fulfilled"
      ? mx.value.map((m) => ({ priority: m.priority, exchange: m.exchange }))
      : [];

  const txtList =
    txt.status === "fulfilled" ? txt.value.map((t) => t.join("")) : [];

  const nsList = ns.status === "fulfilled" ? ns.value : [];

  const soaData =
    soa.status === "fulfilled"
      ? {
          nsname: soa.value.nsname,
          hostmaster: soa.value.hostmaster,
          serial: soa.value.serial,
        }
      : undefined;

  return {
    records,
    nameservers: nsList,
    mx: mxList,
    txt: txtList,
    soa: soaData,
  };
}

export async function resolvePTR(ip: string): Promise<DnsResult> {
  const records: DnsRecord[] = [];

  const ptr = await Promise.allSettled([withTimeout(dns.reverse(ip), TIMEOUT)]);

  if (ptr[0].status === "fulfilled") {
    ptr[0].value.forEach((host) => records.push({ type: "PTR", value: host }));
  }

  return {
    records,
    nameservers: [],
    mx: [],
    txt: [],
  };
}