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

export interface ScanResult {
  domain: string;
  scannedAt: string;
  cached: boolean;
  modules: {
    dns: DnsResult | null;
    whois: WhoisResult | null;
    ssl: SslResult | null;
    http: HttpResult | null;
    ports: PortResult[] | null;
    subdomains: SubdomainResult[] | null;
  };
  errors: Record<string, string>;
}

export interface JobState {
  jobId: string;
  domain: string;
  status: ScanStatus;
  modules: Record<string, ModuleStatus>;
  result?: ScanResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
}