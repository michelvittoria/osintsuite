import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.jobId,
    domain: job.domain,
    targetType: job.targetType,
    status: job.status,
    modules: job.modules,
    result: job.result || null,
    error: job.error || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}