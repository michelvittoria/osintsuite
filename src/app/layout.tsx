import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/i18n";

const SITE_URL = "https://osintsuite.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OSINT Suite — Free Domain & IP Reconnaissance Tool",
    template: "%s | OSINT Suite",
  },
  description:
    "Free OSINT reconnaissance tool with 20 modules: DNS, WHOIS, SSL/TLS, HTTP headers, port scan, subdomain enumeration, CT logs, DNSSEC, email security, ASN lookup, tech fingerprint, CDN detection, reverse IP, traceroute, Wayback and more. Analyze any domain or IPv4 address instantly.",
  keywords: [
    "OSINT",
    "reconnaissance",
    "domain scanner",
    "IP lookup",
    "DNS records",
    "WHOIS",
    "subdomain enumeration",
    "port scan",
    "SSL checker",
    "security.txt",
    "DNSSEC",
    "CT logs",
    "ASN lookup",
    "tech stack fingerprint",
    "CDN detection",
    "reverse IP",
    "traceroute",
    "wayback machine",
    "email harvest",
  ],
  authors: [{ name: "OSINT Suite" }],
  creator: "OSINT Suite",
  alternates: {
    canonical: "/",
    languages: {
      "en": "/",
      "pt": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "OSINT Suite",
    title: "OSINT Suite — Free Domain & IP Reconnaissance Tool",
    description:
      "Analyze any domain or IPv4 with 20 OSINT modules: DNS, WHOIS, SSL, ports, subdomains, DNSSEC and more. Free, no login.",
    locale: "en_US",
    alternateLocale: ["pt_BR"],
  },
  twitter: {
    card: "summary_large_image",
    title: "OSINT Suite — Free Domain & IP Reconnaissance Tool",
    description:
      "Analyze any domain or IPv4 with 20 OSINT modules. Free, no login, no data stored.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OSINT Suite",
  url: SITE_URL,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description:
    "Free OSINT reconnaissance tool with 20 modules to analyze domains and IPv4 addresses.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "DNS Records",
    "WHOIS",
    "SSL/TLS",
    "HTTP Headers",
    "Port Scan",
    "Subdomain Enumeration",
    "CT Logs",
    "DNSSEC",
    "Email Security",
    "ASN Lookup",
    "Tech Fingerprint",
    "CDN Detection",
    "Reverse IP",
    "Traceroute",
    "Wayback",
    "AXFR",
    "Email Harvest",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieValue = (await cookies()).get("NEXT_LOCALE")?.value ?? null;
  const cookieLocale = cookieValue === "en" || cookieValue === "pt" ? cookieValue : null;
  const host = (await headers()).get("host") ?? "";
  const initialLocale = cookieLocale ?? (host.includes(".br") ? "pt" : "en");

  return (
    <html lang={initialLocale}>
      <body className="min-h-screen bg-background mono antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </body>
    </html>
  );
}