import type { WhoisResult, DnsResult } from "@/lib/types";

export interface EmailHarvestResult {
  emails: string[];
  sources: {
    whois: string[];
    txt: string[];
    other: string[];
  };
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function extractFromWhois(whoisData: WhoisResult | null): string[] {
  if (!whoisData) return [];
  const emails: string[] = [];

  for (const field of ["registrar", "registrant"]) {
    const value = whoisData[field as keyof WhoisResult];
    if (typeof value === "string") {
      const found = value.match(EMAIL_REGEX);
      if (found) emails.push(...found);
    }
  }

  if (whoisData.raw) {
    const found = whoisData.raw.match(EMAIL_REGEX);
    if (found) emails.push(...found);
  }

  return unique(emails);
}

function extractFromDns(dnsData: DnsResult | null): string[] {
  if (!dnsData) return [];
  const emails: string[] = [];

  for (const mx of dnsData.mx) {
    const found = mx.exchange.match(EMAIL_REGEX);
    if (found) emails.push(...found);
  }

  for (const txt of dnsData.txt) {
    const found = txt.match(EMAIL_REGEX);
    if (found) emails.push(...found);
  }

  return unique(emails);
}

function extractFromOther(httpUrl?: string, htmlContent?: string): string[] {
  const emails: string[] = [];

  if (httpUrl) {
    const found = httpUrl.match(EMAIL_REGEX);
    if (found) emails.push(...found);
  }

  if (htmlContent) {
    const found = htmlContent.match(EMAIL_REGEX);
    if (found) emails.push(...found);
  }

  return unique(emails);
}

export async function scanEmailHarvest(
  whoisData: WhoisResult | null,
  dnsData: DnsResult | null,
  httpUrl?: string,
  htmlContent?: string
): Promise<EmailHarvestResult> {
  const whoisEmails = extractFromWhois(whoisData);
  const txtEmails = extractFromDns(dnsData);
  const otherEmails = extractFromOther(httpUrl, htmlContent);

  const allEmails = unique([...whoisEmails, ...txtEmails, ...otherEmails]);

  return {
    emails: allEmails,
    sources: {
      whois: whoisEmails,
      txt: txtEmails,
      other: otherEmails,
    },
  };
}