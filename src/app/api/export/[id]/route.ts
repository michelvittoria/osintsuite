import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-queue";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const format = req.nextUrl.searchParams.get("format") || "json";
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.result) {
    return NextResponse.json({ error: "No result available" }, { status: 404 });
  }

  if (format === "csv") {
    return exportCsv(job.result);
  }

  return NextResponse.json(job.result, {
    headers: {
      "Content-Disposition": `attachment; filename="${job.domain}-scan.json"`,
    },
  });
}

function exportCsv(result: any): NextResponse {
  const rows: string[][] = [];

  // DNS records
  if (result.modules.dns?.records) {
    rows.push(["Module", "Type", "Value"]);
    for (const r of result.modules.dns.records) {
      rows.push(["DNS", r.type, r.value]);
    }
  }

  // WHOIS
  if (result.modules.whois) {
    const w = result.modules.whois;
    if (w.registrar) rows.push(["WHOIS", "Registrar", w.registrar]);
    if (w.registrant) rows.push(["WHOIS", "Registrant", w.registrant]);
    if (w.createdDate) rows.push(["WHOIS", "Created", w.createdDate]);
    if (w.updatedDate) rows.push(["WHOIS", "Updated", w.updatedDate]);
    if (w.expiryDate) rows.push(["WHOIS", "Expiry", w.expiryDate]);
    if (w.nameservers) w.nameservers.forEach((n: string) => rows.push(["WHOIS", "Nameserver", n]));
    if (w.status) w.status.forEach((s: string) => rows.push(["WHOIS", "Status", s]));
  }

  // SSL
  if (result.modules.ssl) {
    const s = result.modules.ssl;
    rows.push(["SSL", "Subject", s.subject]);
    rows.push(["SSL", "Issuer", s.issuer]);
    rows.push(["SSL", "Valid From", s.validFrom]);
    rows.push(["SSL", "Valid To", s.validTo]);
    rows.push(["SSL", "Days Remaining", String(s.daysRemaining)]);
    rows.push(["SSL", "Protocol", s.protocol]);
    if (s.sans) s.sans.forEach((san: string) => rows.push(["SSL", "SAN", san]));
  }

  // HTTP
  if (result.modules.http) {
    const h = result.modules.http;
    rows.push(["HTTP", "Status", `${h.status} ${h.statusText}`]);
    rows.push(["HTTP", "Server", h.server || ""]);
    rows.push(["HTTP", "Final URL", h.finalUrl]);
    if (h.title) rows.push(["HTTP", "Title", h.title]);
  }

  // Ports
  if (result.modules.ports) {
    for (const p of result.modules.ports) {
      if (p.open) rows.push(["Port", String(p.port), p.service || "open"]);
    }
  }

  // Subdomains
  if (result.modules.subdomains) {
    for (const s of result.modules.subdomains) {
      rows.push(["Subdomain", s.subdomain, s.ips.join(",")]);
    }
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${result.domain}-scan.csv"`,
    },
  });
}