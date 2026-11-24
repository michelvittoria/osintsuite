export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWorker } = await import("@/lib/job-queue");
    startWorker();
    console.log("[instrumentation] scan worker started");
  }
}
