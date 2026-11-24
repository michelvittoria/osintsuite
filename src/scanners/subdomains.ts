import dns from "dns/promises";
import type { SubdomainResult } from "@/lib/types";

const TIMEOUT = 5000;
const CONCURRENCY = 20;

const COMMON_SUBDOMAINS = [
  "www", "mail", "ftp", "webmail", "smtp", "pop", "ns1", "ns2",
  "ns3", "ns4", "dns", "dns1", "dns2", "mx", "mx1", "mx2",
  "email", "imap", "exchange", "owa", "autodiscover", "autoconfig",
  "cpanel", "whm", "webdisk", "admin", "administrator", "adminpanel",
  "api", "api1", "api2", "dev", "staging", "stage", "test", "testing",
  "qa", "uat", "prod", "production", "beta", "alpha", "demo",
  "blog", "news", "press", "media", "cdn", "static", "assets",
  "images", "img", "files", "download", "downloads", "upload",
  "shop", "store", "cart", "payment", "pay", "billing",
  "support", "help", "helpdesk", "tickets", "docs", "documentation",
  "wiki", "kb", "knowledge", "forum", "community", "social",
  "login", "signin", "signup", "register", "auth", "sso", "oauth",
  "dashboard", "panel", "portal", "client", "clients", "customer",
  "secure", "ssl", "vpn", "remote", "access", "gateway",
  "proxy", "cache", "redis", "memcached", "db", "database",
  "mysql", "postgres", "mongo", "elastic", "search",
  "git", "gitlab", "github", "svn", "repo", "code",
  "jenkins", "ci", "cd", "build", "deploy", "release",
  "monitor", "monitoring", "grafana", "kibana", "prometheus",
  "status", "uptime", "ping", "health", "healthcheck",
  "backup", "bak", "old", "new", "temp", "tmp",
  "internal", "intranet", "private", "corp", "office",
  "mail1", "mail2", "mail3", "web1", "web2", "web3",
  "app", "apps", "mobile", "m", "wap",
  "video", "stream", "streaming", "live", "radio", "tv",
  "game", "games", "play", "gaming",
  "shop1", "shop2", "store1", "store2",
  "us", "eu", "asia", "uk", "br", "de", "fr", "jp", "cn",
  "north", "south", "east", "west", "central",
  "main", "primary", "secondary", "backup1", "backup2",
  "node1", "node2", "node3", "server1", "server2", "server3",
  "host", "hosting", "cloud", "aws", "azure", "gcp",
  "docker", "k8s", "kubernetes", "container",
  "registry", "harbor", "nexus", "artifactory",
  "jira", "confluence", "redmine", "bugzilla",
  "mattermost", "slack", "rocketchat", "zulip",
  "nextcloud", "owncloud", "drive", "cloud",
  "wordpress", "wp", "drupal", "joomla", "magento",
  "phpmyadmin", "adminer", "pma",
  "roundcube", "squirrelmail", "rainloop",
  "webmin", "virtualmin", "usermin",
  "nagios", "zabbix", "icinga", "checkmk",
  "splunk", "logstash", "fluentd",
  "sonar", "sonarqube", "sentry",
  "vault", "consul", "nomad", "terraform",
  "ansible", "puppet", "chef", "salt",
];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

async function checkSubdomain(domain: string, sub: string): Promise<SubdomainResult | null> {
  const fqdn = `${sub}.${domain}`;
  try {
    const addresses = await withTimeout(dns.resolve4(fqdn), TIMEOUT);
    return { subdomain: fqdn, ips: addresses };
  } catch {
    return null;
  }
}

export async function scanSubdomains(domain: string): Promise<SubdomainResult[]> {
  const results: SubdomainResult[] = [];
  const queue = [...COMMON_SUBDOMAINS];

  async function worker() {
    while (queue.length > 0) {
      const sub = queue.shift();
      if (!sub) break;
      const result = await checkSubdomain(domain, sub);
      if (result) results.push(result);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  return results.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
}