import { resolveTxt } from "dns/promises";

export interface EmailSecurityResult {
  spf: { record: string; valid: boolean; all: string } | null;
  dmarc: { record: string; policy: string; pct: number } | null;
  dkim: { selectors: string[]; records: Record<string, string> };
}

const DKIM_SELECTORS = [
  "default",
  "google",
  "selector1",
  "selector2",
  "k1",
  "s1",
  "s2",
  "mail",
  "dkim",
  "smtp",
  "mandrill",
  "sendgrid",
  "amazonses",
  "mailchimp",
  "postmark",
];

async function getTxtRecords(name: string): Promise<string[]> {
  try {
    const records = await resolveTxt(name);
    return records.map((r) => r.join(""));
  } catch {
    return [];
  }
}

function parseSpf(records: string[]): EmailSecurityResult["spf"] {
  const spf = records.find((r) => r.toLowerCase().startsWith("v=spf1"));
  if (!spf) return null;

  const allMatch = spf.match(/([~\-+?]all)\b/i);
  const all = allMatch ? allMatch[1].toLowerCase() : "none";

  const valid = /^v=spf1\s/.test(spf) && spf.length < 512;

  return { record: spf, valid, all };
}

function parseDmarc(records: string[]): EmailSecurityResult["dmarc"] {
  const dmarc = records.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
  if (!dmarc) return null;

  const policyMatch = dmarc.match(/\bp=(\w+)/i);
  const pctMatch = dmarc.match(/\bpct=(\d+)/i);

  return {
    record: dmarc,
    policy: policyMatch ? policyMatch[1].toLowerCase() : "none",
    pct: pctMatch ? parseInt(pctMatch[1], 10) : 100,
  };
}

async function findDkim(domain: string): Promise<EmailSecurityResult["dkim"]> {
  const found: Record<string, string> = {};
  const selectors: string[] = [];

  const results = await Promise.all(
    DKIM_SELECTORS.map(async (selector) => {
      const records = await getTxtRecords(`${selector}._domainkey.${domain}`);
      const dkim = records.find((r) => r.toLowerCase().includes("v=dkim1"));
      return { selector, record: dkim };
    })
  );

  for (const { selector, record } of results) {
    if (record) {
      selectors.push(selector);
      found[selector] = record;
    }
  }

  return { selectors, records: found };
}

export async function scanEmailSecurity(domain: string): Promise<EmailSecurityResult> {
  const [rootTxt, dmarcTxt, dkim] = await Promise.all([
    getTxtRecords(domain),
    getTxtRecords(`_dmarc.${domain}`),
    findDkim(domain),
  ]);

  return {
    spf: parseSpf(rootTxt),
    dmarc: parseDmarc(dmarcTxt),
    dkim,
  };
}