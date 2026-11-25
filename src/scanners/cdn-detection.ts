import type { HttpResult, DnsResult } from "@/lib/types";

export interface CdnDetectionResult {
  detected: boolean;
  provider?: string;
  evidence: string[];
  headers: Record<string, string>;
  cname?: string;
}

const CDN_PATTERNS: Array<{
  name: string;
  headers?: Record<string, RegExp>;
  cname?: RegExp[];
  server?: RegExp;
}> = [
  {
    name: "Cloudflare",
    headers: { server: /cloudflare/i, "cf-ray": /.+/, "cf-cache-status": /.+/ },
    cname: [/cloudflare\.net$/i, /cloudflare\.com$/i],
  },
  {
    name: "Akamai",
    headers: { server: /akamai/i, "x-akamai-transformed": /.+/, "akamai-origin-hop": /.+/ },
    cname: [/akamai\.net$/i, /akamaiedge\.net$/i, /akamai\.com$/i],
  },
  {
    name: "Fastly",
    headers: { "fastly-ff": /.+/, via: /fastly/i, "x-served-by": /cache-.+\.fastly\.net/i },
    cname: [/fastly\.net$/i, /fastlylb\.net$/i],
  },
  {
    name: "AWS CloudFront",
    headers: { via: /cloudfront/i, "x-amz-cf-id": /.+/, "x-amz-cf-pop": /.+/ },
    cname: [/cloudfront\.net$/i],
  },
  {
    name: "Google Cloud CDN",
    headers: { via: /google/i, "x-cloud-trace-context": /.+/, server: /gws/i },
    cname: [/googleusercontent\.com$/i, /ghs\.google\.com$/i],
  },
  {
    name: "Netlify",
    headers: { server: /netlify/i, "x-nf-request-id": /.+/, "x-nf-cache": /.+/ },
    cname: [/netlify\.app$/i, /netlify\.com$/i],
  },
  {
    name: "Vercel",
    headers: { server: /vercel/i, "x-vercel-id": /.+/, "x-vercel-cache": /.+/ },
    cname: [/vercel\.app$/i, /vercel\.com$/i],
  },
  {
    name: "BunnyCDN",
    headers: { server: /bunnycdn/i, "cdn-pullzone": /.+/, "cdn-request-id": /.+/ },
    cname: [/b-cdn\.net$/i, /bunnycdn\.com$/i],
  },
  {
    name: "KeyCDN",
    headers: { "x-edge-location": /.+/, via: /keycdn/i },
    cname: [/kxcdn\.com$/i, /keycdn\.net$/i],
  },
  {
    name: "StackPath",
    headers: { server: /stackpath/i, "x-sp-cache": /.+/, via: /stackpath/i },
    cname: [/stackpath\.com$/i, /stackpathcdn\.com$/i],
  },
  {
    name: "Cloudinary",
    headers: { via: /cloudinary/i },
    cname: [/cloudinary\.com$/i, /res\.cloudinary\.com$/i],
  },
  {
    name: "Imgix",
    headers: { via: /imgix/i },
    cname: [/imgix\.net$/i],
  },
  {
    name: "Section.io",
    headers: { via: /section\.io/i, "x-section-cache": /.+/ },
    cname: [/section\.io$/i],
  },
  {
    name: "Incapsula/Imperva",
    headers: { "x-iinfo": /.+/, "x-cdn": /incapsula/i },
    cname: [/incapdns\.net$/i, /incapsula\.com$/i],
  },
  {
    name: "Sucuri",
    headers: { server: /sucuri/i, "x-sucuri-id": /.+/ },
    cname: [/sucuri\.net$/i],
  },
  {
    name: "Azure CDN",
    headers: { "x-azure-ref": /.+/, via: /azure/i },
    cname: [/azureedge\.net$/i, /azurefd\.net$/i],
  },
];

function extractCname(dnsData: DnsResult | null): string | undefined {
  if (!dnsData) return undefined;
  for (const record of dnsData.records) {
    if (record.type === "CNAME") return record.value;
  }
  return undefined;
}

export async function scanCdnDetection(
  httpData: HttpResult | null,
  dnsData: DnsResult | null
): Promise<CdnDetectionResult> {
  const evidence: string[] = [];
  const headers = httpData?.headers || {};
  const cname = extractCname(dnsData);

  for (const cdn of CDN_PATTERNS) {
    let matched = false;
    const matchedEvidence: string[] = [];

    if (cdn.headers) {
      for (const [header, pattern] of Object.entries(cdn.headers)) {
        const value = headers[header.toLowerCase()];
        if (value && pattern.test(value)) {
          matched = true;
          matchedEvidence.push(`Header ${header}: ${value}`);
        }
      }
    }

    if (cdn.cname && cname) {
      for (const pattern of cdn.cname) {
        if (pattern.test(cname)) {
          matched = true;
          matchedEvidence.push(`CNAME: ${cname}`);
        }
      }
    }

    if (cdn.server && headers["server"] && cdn.server.test(headers["server"])) {
      matched = true;
      matchedEvidence.push(`Server: ${headers["server"]}`);
    }

    if (matched) {
      return {
        detected: true,
        provider: cdn.name,
        evidence: matchedEvidence,
        headers,
        cname,
      };
    }
  }

  return {
    detected: false,
    evidence,
    headers,
    cname,
  };
}