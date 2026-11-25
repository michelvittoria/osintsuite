import type { HttpResult } from "@/lib/types";

export interface TechFingerprintResult {
  technologies: { name: string; confidence: number; version?: string; categories: string[] }[];
}

const FINGERPRINTS: Array<{
  name: string;
  categories: string[];
  headers?: Record<string, RegExp>;
  html?: RegExp[];
  cookies?: RegExp[];
}> = [
  { name: "Cloudflare", categories: ["CDN"], headers: { server: /cloudflare/i, "cf-ray": /.+/ } },
  { name: "nginx", categories: ["Web Server"], headers: { server: /nginx/i } },
  { name: "Apache", categories: ["Web Server"], headers: { server: /apache/i } },
  { name: "Microsoft-IIS", categories: ["Web Server"], headers: { server: /microsoft-iis/i } },
  { name: "OpenResty", categories: ["Web Server"], headers: { server: /openresty/i } },
  { name: "Caddy", categories: ["Web Server"], headers: { server: /caddy/i } },
  { name: "Varnish", categories: ["Cache"], headers: { "x-varnish": /.+/, via: /varnish/i } },
  { name: "Fastly", categories: ["CDN"], headers: { "fastly-ff": /.+/, via: /fastly/i } },
  { name: "Akamai", categories: ["CDN"], headers: { "x-akamai-transformed": /.+/, server: /akamai/i } },
  { name: "Netlify", categories: ["Hosting"], headers: { server: /netlify/i, "x-nf-request-id": /.+/ } },
  { name: "Vercel", categories: ["Hosting"], headers: { server: /vercel/i, "x-vercel-id": /.+/ } },
  { name: "GitHub Pages", categories: ["Hosting"], headers: { server: /github.com/i } },
  { name: "AWS CloudFront", categories: ["CDN"], headers: { via: /cloudfront/i, "x-amz-cf-id": /.+/ } },
  { name: "Google Cloud", categories: ["Hosting"], headers: { server: /gws/i, "x-cloud-trace-context": /.+/ } },
  { name: "PHP", categories: ["Language"], headers: { "x-powered-by": /php/i } },
  { name: "Express", categories: ["Framework"], headers: { "x-powered-by": /express/i } },
  { name: "Next.js", categories: ["Framework"], headers: { "x-powered-by": /next\.js/i }, html: [/__NEXT_DATA__/, /_next\/static/] },
  { name: "Nuxt.js", categories: ["Framework"], html: [/nuxt/i, /_nuxt/] },
  { name: "React", categories: ["Framework"], html: [/react/i, /data-reactroot/] },
  { name: "Vue.js", categories: ["Framework"], html: [/vue\.js/i, /data-v-/] },
  { name: "Angular", categories: ["Framework"], html: [/ng-version/, /angular/i] },
  { name: "Svelte", categories: ["Framework"], html: [/svelte/i] },
  { name: "WordPress", categories: ["CMS"], headers: { "x-powered-by": /wordpress/i }, html: [/wp-content/, /wp-includes/, /wordpress/i] },
  { name: "Drupal", categories: ["CMS"], headers: { "x-generator": /drupal/i }, html: [/drupal/i, /sites\/default/] },
  { name: "Joomla", categories: ["CMS"], html: [/joomla/i, /option=com_/] },
  { name: "Magento", categories: ["E-commerce"], html: [/magento/i, /Mage\.Cookies/] },
  { name: "Shopify", categories: ["E-commerce"], headers: { "x-shopify-stage": /.+/, "x-shopify-shop": /.+/ } },
  { name: "Wix", categories: ["Website Builder"], headers: { server: /wix/i }, html: [/wix/i] },
  { name: "Squarespace", categories: ["Website Builder"], html: [/squarespace/i, /static\.squarespace\.com/] },
  { name: "Google Analytics", categories: ["Analytics"], html: [/google-analytics\.com/, /gtag\(/] },
  { name: "Google Tag Manager", categories: ["Analytics"], html: [/googletagmanager\.com/] },
  { name: "Matomo", categories: ["Analytics"], html: [/matomo\.js/, /piwik\.js/] },
  { name: "Hotjar", categories: ["Analytics"], html: [/hotjar\.com/] },
  { name: "reCAPTCHA", categories: ["Security"], html: [/recaptcha/i, /grecaptcha/] },
  { name: "Cloudflare Turnstile", categories: ["Security"], html: [/turnstile/i, /cf-turnstile/] },
  { name: "jQuery", categories: ["Library"], html: [/jquery/i] },
  { name: "Bootstrap", categories: ["Library"], html: [/bootstrap/i] },
  { name: "Font Awesome", categories: ["Library"], html: [/fontawesome/i, /fa-/] },
];

function detectFromHeaders(headers: Record<string, string>): Array<{ name: string; confidence: number; version?: string; categories: string[] }> {
  const results: Array<{ name: string; confidence: number; version?: string; categories: string[] }> = [];
  const lowerHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = v;
  }

  for (const fp of FINGERPRINTS) {
    let matched = false;
    let confidence = 50;

    if (fp.headers) {
      for (const [header, pattern] of Object.entries(fp.headers)) {
        const value = lowerHeaders[header.toLowerCase()];
        if (value && pattern.test(value)) {
          matched = true;
          confidence = 80;
          break;
        }
      }
    }

    if (matched) {
      results.push({ name: fp.name, confidence, categories: fp.categories });
    }
  }

  return results;
}

function detectFromHtml(html: string): Array<{ name: string; confidence: number; version?: string; categories: string[] }> {
  const results: Array<{ name: string; confidence: number; version?: string; categories: string[] }> = [];

  for (const fp of FINGERPRINTS) {
    if (!fp.html) continue;
    let matched = false;
    for (const pattern of fp.html) {
      if (pattern.test(html)) {
        matched = true;
        break;
      }
    }
    if (matched) {
      results.push({ name: fp.name, confidence: 70, categories: fp.categories });
    }
  }

  return results;
}

function detectFromCookies(headers: Record<string, string>): Array<{ name: string; confidence: number; version?: string; categories: string[] }> {
  const results: Array<{ name: string; confidence: number; version?: string; categories: string[] }> = [];
  const cookieHeader = headers["set-cookie"] || headers["cookie"] || "";
  if (!cookieHeader) return results;

  for (const fp of FINGERPRINTS) {
    if (!fp.cookies) continue;
    for (const pattern of fp.cookies) {
      if (pattern.test(cookieHeader)) {
        results.push({ name: fp.name, confidence: 60, categories: fp.categories });
        break;
      }
    }
  }

  return results;
}

function deduplicate(techs: Array<{ name: string; confidence: number; version?: string; categories: string[] }>): Array<{ name: string; confidence: number; version?: string; categories: string[] }> {
  const seen = new Map<string, { name: string; confidence: number; version?: string; categories: string[] }>();
  for (const t of techs) {
    const existing = seen.get(t.name);
    if (!existing || t.confidence > existing.confidence) {
      seen.set(t.name, t);
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
}

export async function scanTechFingerprint(httpData: HttpResult | null): Promise<TechFingerprintResult> {
  if (!httpData) return { technologies: [] };

  const headerTechs = detectFromHeaders(httpData.headers);
  const htmlTechs = httpData.title ? detectFromHtml(httpData.title) : [];
  const cookieTechs = detectFromCookies(httpData.headers);

  const allTechs = deduplicate([...headerTechs, ...htmlTechs, ...cookieTechs]);

  return { technologies: allTechs };
}