import { NextRequest, NextResponse } from "next/server";
import { detectTarget, resolveAndGuard } from "@/lib/validate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createJob, getCachedResult, processJob, setJobResult } from "@/lib/job-queue";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
  }

  let body: { domain?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept either `target` (new, auto-detected) or `domain` (legacy).
  const rawInput = body.target ?? body.domain ?? "";
  const detected = detectTarget(rawInput);

  if (!detected.valid) {
    return NextResponse.json({ error: detected.error }, { status: 400 });
  }

  const targetType = detected.type;
  const value = detected.type === "ip" ? detected.ip : detected.domain;

  const cached = await getCachedResult(targetType, value);
  if (cached) {
    // Create a job with cached result so frontend can poll normally
    const jobId = await createJob(value, targetType);
    await setJobResult(jobId, cached);
    return NextResponse.json({
      jobId,
      status: "done",
      rateLimit: {
        remainingMinute: rateLimit.remainingMinute,
        remainingDay: rateLimit.remainingDay,
      },
    });
  }

  // SSRF guard: for domains, resolve and block private IPs. For direct IPs,
  // validateIp already rejected private ranges during detection.
  if (targetType === "domain") {
    const guard = await resolveAndGuard(value);
    if (!guard.safe) {
      return NextResponse.json({ error: guard.error }, { status: 400 });
    }
  }

  const jobId = await createJob(value, targetType);

  // Fire-and-forget: process in background, frontend polls /api/scan/:id
  processJob(jobId).catch((e) => console.error("[scan] job failed:", e));

  return NextResponse.json({
    jobId,
    status: "pending",
    rateLimit: {
      remainingMinute: rateLimit.remainingMinute,
      remainingDay: rateLimit.remainingDay,
    },
  });
}