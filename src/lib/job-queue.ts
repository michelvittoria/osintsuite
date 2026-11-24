import { getRedis, KEYS, TTL } from "@/lib/redis";
import type { JobState, ScanResult, ModuleStatus } from "@/lib/types";
import { runScan, ModuleName, MODULES } from "@/scanners";

const JOB_TIMEOUT = 60000; // 60s max per job

export async function createJob(domain: string): Promise<string> {
  const redis = getRedis();
  const jobId = crypto.randomUUID();
  const now = Date.now();

  const job: JobState = {
    jobId,
    domain,
    status: "pending",
    modules: Object.fromEntries(
      ["dns", "whois", "ssl", "http", "ports", "subdomains"].map((m) => [m, "pending"])
    ),
    createdAt: now,
    updatedAt: now,
  };

  await redis.setex(KEYS.job(jobId), TTL.job, JSON.stringify(job));
  return jobId;
}

export async function getJob(jobId: string): Promise<JobState | null> {
  const redis = getRedis();
  const data = await redis.get(KEYS.job(jobId));
  return data ? JSON.parse(data) : null;
}

export async function updateJob(jobId: string, updates: Partial<JobState>): Promise<void> {
  const redis = getRedis();
  const existing = await getJob(jobId);
  if (!existing) return;

  const updated: JobState = {
    ...existing,
    ...updates,
    modules: { ...existing.modules, ...(updates.modules ?? {}) },
    updatedAt: Date.now(),
  };
  await redis.setex(KEYS.job(jobId), TTL.job, JSON.stringify(updated));
}

export async function setJobResult(jobId: string, result: ScanResult): Promise<void> {
  // Derive final module statuses from the result so the UI never shows a
  // module stuck at "running" after the job completes.
  const modules: Record<string, ModuleStatus> = {};
  for (const name of MODULES) {
    modules[name] = result.errors[name] ? "error" : "done";
  }
  await updateJob(jobId, { status: "done", result, modules });
}

export async function setJobError(jobId: string, error: string): Promise<void> {
  await updateJob(jobId, { status: "error", error });
}

export async function getCachedResult(domain: string): Promise<ScanResult | null> {
  const redis = getRedis();
  const data = await redis.get(KEYS.cache(domain));
  return data ? JSON.parse(data) : null;
}

export async function setCachedResult(domain: string, result: ScanResult): Promise<void> {
  const redis = getRedis();
  await redis.setex(KEYS.cache(domain), TTL.cache, JSON.stringify({ ...result, cached: true }));
}

export async function processJob(jobId: string): Promise<void> {
  const job = await getJob(jobId);
  if (!job || job.status !== "pending") return;

  await updateJob(jobId, { status: "running" });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Job timeout")), JOB_TIMEOUT)
  );

  try {
    const result = await Promise.race([
      runScan(job.domain, async (module, status) => {
        await updateJob(jobId, {
          modules: { [module]: status },
        });
      }),
      timeoutPromise,
    ]);

    await setJobResult(jobId, result);
    await setCachedResult(job.domain, result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await setJobError(jobId, msg);
  }
}

export async function startWorker(): Promise<void> {
  setInterval(async () => {
    const redis = getRedis();
    const keys = await redis.keys("job:*");
    for (const key of keys) {
      const jobId = key.replace("job:", "");
      const job = await getJob(jobId);
      if (job && job.status === "pending") {
        processJob(jobId).catch(console.error);
      }
    }
  }, 1000);
}