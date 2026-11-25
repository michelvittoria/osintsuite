import { assertSafeUrl } from "@/lib/safe-net";

export interface DnssecResult {
  hasDnssec: boolean;
  algorithm?: number;
  keyTag?: number;
  digestType?: number;
  digest?: string;
  validated: boolean;
}

const CLOUDFLARE_DOH = "https://cloudflare-dns.com/dns-query";

async function dohQuery(domain: string, type: string): Promise<any[]> {
  const url = `${CLOUDFLARE_DOH}?name=${encodeURIComponent(domain)}&type=${type}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    await assertSafeUrl(url);
    const res = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const json = await res.json();
    return json.Answer || [];
  } catch {
    return [];
  }
}

function decodeBase64Url(b64: string): string {
  return b64.replace(/_/g, "+").replace(/-/g, "/");
}

function calculateKeyTag(base64Key: string): number {
  const key = Buffer.from(decodeBase64Url(base64Key), "base64");
  let ac = 0;
  for (let i = 0; i < key.length; i++) {
    if (i % 2 === 0) ac += key[i] << 8;
    else ac += key[i];
  }
  ac += (ac >> 16) & 0xffff;
  return ac & 0xffff;
}

function parseDsAnswer(answer: any): { keyTag: number; algorithm: number; digestType: number; digest: string } | null {
  const parts = answer.data.split(/\s+/);
  if (parts.length < 4) return null;
  return {
    keyTag: parseInt(parts[0], 10),
    algorithm: parseInt(parts[1], 10),
    digestType: parseInt(parts[2], 10),
    digest: parts.slice(3).join("").toUpperCase(),
  };
}

function parseDnskeyAnswer(answer: any): { algorithm: number; keyTag: number } | null {
  const parts = answer.data.split(/\s+/);
  if (parts.length < 4) return null;
  const flags = parseInt(parts[0], 10);
  const protocol = parseInt(parts[1], 10);
  const algorithm = parseInt(parts[2], 10);
  if (flags !== 257 || protocol !== 3) return null;
  const keyTag = calculateKeyTag(parts[3]);
  return { algorithm, keyTag };
}

export async function scanDnssec(domain: string): Promise<DnssecResult> {
  const dsAnswers = await dohQuery(domain, "DS");
  if (dsAnswers.length === 0) {
    return { hasDnssec: false, validated: false };
  }

  const ds = parseDsAnswer(dsAnswers[0]);
  if (!ds) {
    return { hasDnssec: true, validated: false };
  }

  const dnskeyAnswers = await dohQuery(domain, "DNSKEY");
  let validated = false;
  let matchedAlgorithm = ds.algorithm;
  let matchedKeyTag = ds.keyTag;
  let matchedDigestType = ds.digestType;
  let matchedDigest = ds.digest;

  for (const answer of dnskeyAnswers) {
    const parsed = parseDnskeyAnswer(answer);
    if (parsed && parsed.keyTag === ds.keyTag && parsed.algorithm === ds.algorithm) {
      validated = true;
      break;
    }
  }

  return {
    hasDnssec: true,
    algorithm: matchedAlgorithm,
    keyTag: matchedKeyTag,
    digestType: matchedDigestType,
    digest: matchedDigest,
    validated,
  };
}