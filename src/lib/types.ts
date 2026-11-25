export type ScanStatus = "pending" | "running" | "done" | "error";

export type ModuleStatus = "pending" | "running" | "done" | "error";

export interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
}

export interface DnsResult {
  records: DnsRecord[];
  nameservers: string[];
  mx: { priority: number; exchange: string }[];
  txt: string[];
  soa?: { nsname: string; hostmaster: string; serial: number };
}

export interface WhoisResult {
  registrar?: string;
  registrant?: string;
  createdDate?: string;
  updatedDate?: string;
  expiryDate?: string;
  nameservers: string[];
  status: string[];
  raw?: string;
}

export interface SslResult {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  serialNumber: string;
  sans: string[];
  protocol: string;
}

export interface HttpResult {
  status: number;
  statusText: string;
  server?: string;
  headers: Record<string, string>;
  redirects: string[];
  finalUrl: string;
  title?: string;
}

export interface PortResult {
  port: number;
  open: boolean;
  service?: string;
  banner?: string;
}

export interface SubdomainResult {
  subdomain: string;
  ips: string[];
}

export interface IpGeoResult {
  query: string;
  country?: string;
  countryCode?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  org?: string;
  asn?: string;
  timezone?: string;
}

export interface CtLogsResult {
  subdomains: string[];
}

export interface DnssecResult {
  hasDnssec: boolean;
  algorithm?: number;
  keyTag?: number;
  digestType?: number;
  digest?: string;
  validated: boolean;
}

export interface EmailSecurityResult {
  spf: { record: string; valid: boolean; all: string } | null;
  dmarc: { record: string; policy: string; pct: number } | null;
  dkim: { selectors: string[]; records: Record<string, string> };
}

export interface TechFingerprintResult {
  technologies: { name: string; confidence: number; version?: string; categories: string[] }[];
}

export interface SecurityTxtResult {
  exists: boolean;
  contact?: string;
  expires?: string;
  encryption?: string;
  acknowledgments?: string;
  policy?: string;
  preferredLanguages?: string[];
  canonical?: string;
  raw: string;
}

export interface RobotsTxtResult {
  exists: boolean;
  disallow: string[];
  allow: string[];
  sitemaps: string[];
  crawlDelay?: number;
  raw: string;
}

export interface AsnLookupResult {
  asns: { ip: string; asn: string; org: string; isp: string }[];
}

export interface ReverseIpResult {
  ip: string;
  domains: string[];
}

export interface TracerouteResult {
  hops: { hop: number; ip: string; rtt: number; hostname?: string }[];
}

export interface CdnDetectionResult {
  detected: boolean;
  provider?: string;
  evidence: string[];
  cnames: string[];
}

export interface WaybackResult {
  snapshots: { url: string; timestamp: string }[];
  total: number;
}

export interface AxfrResult {
  vulnerable: boolean;
  nameservers: { ns: string; axfr: boolean; records?: DnsRecord[] }[];
}

export interface EmailHarvestResult {
  emails: string[];
  sources: { whois: string[]; txt: string[]; other: string[] };
}

export type TargetType = "domain" | "ip";

export interface ScanResult {
  domain: string;
  targetType: TargetType;
  scannedAt: string;
  cached: boolean;
  modules: {
    dns: DnsResult | null;
    whois: WhoisResult | null;
    ssl: SslResult | null;
    http: HttpResult | null;
    ports: PortResult[] | null;
    subdomains: SubdomainResult[] | null;
    ipGeo?: IpGeoResult | null;
    ctLogs?: CtLogsResult | null;
    securityTxt?: SecurityTxtResult | null;
    robotsTxt?: RobotsTxtResult | null;
    dnssec?: DnssecResult | null;
    emailSecurity?: EmailSecurityResult | null;
    asnLookup?: AsnLookupResult | null;
    techFingerprint?: TechFingerprintResult | null;
    cdnDetection?: CdnDetectionResult | null;
    reverseIp?: ReverseIpResult | null;
    traceroute?: TracerouteResult | null;
    wayback?: WaybackResult | null;
    axfr?: AxfrResult | null;
    emailHarvest?: EmailHarvestResult | null;
  };
  errors: Record<string, string>;
}

export interface JobState {
  jobId: string;
  domain: string;
  targetType: TargetType;
  status: ScanStatus;
  modules: Record<string, ModuleStatus>;
  result?: ScanResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
}