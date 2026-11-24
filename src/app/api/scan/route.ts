import { NextRequest, NextResponse } from "next/server";
import { validateDomain, resolveAndGuard } from "@/lib/validate";
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

  let body: { domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateDomain(body.domain || "");
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const domain = validation.domain!;

  const cached = await getCachedResult(domain);
  if (cached) {
    // Create a job with cached result so frontend can poll normally
    const jobId = await createJob(domain);
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

  const guard = await resolveAndGuard(domain);
  if (!guard.safe) {
    return NextResponse.json({ error: guard.error }, { status: 400 });
  }

  const jobId = await createJob(domain);

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
