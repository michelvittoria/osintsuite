import { spawn } from "child_process";

export interface TracerouteHop {
  hop: number;
  ip: string;
  rtt: number;
  hostname?: string;
}

export interface TracerouteResult {
  hops: TracerouteHop[];
  target: string;
}

const TIMEOUT_MS = 30000;

function parseTraceroute(output: string): TracerouteHop[] {
  const lines = output.split("\n");
  const hops: TracerouteHop[] = [];

  for (const line of lines) {
    // Match lines like: " 1  10.0.0.1  12.345 ms" or " 1  * * *"
    const match = line.match(/^\s*(\d+)\s+(.+)$/);
    if (!match) continue;

    const hopNum = parseInt(match[1], 10);
    const rest = match[2].trim();

    // Skip empty hops
    if (rest === "* * *" || rest === "*") continue;

    // Parse RTT values and IP/hostname
    const parts = rest.split(/\s+/);
    const ipsAndHosts: string[] = [];
    const rtts: number[] = [];

    for (const part of parts) {
      if (/^\d+(\.\d+)?\s*ms$/.test(part)) {
        rtts.push(parseFloat(part));
      } else if (part && !/^\d+$/.test(part)) {
        ipsAndHosts.push(part);
      }
    }

    if (ipsAndHosts.length > 0) {
      const ip = ipsAndHosts[0];
      const hostname = ipsAndHosts.length > 1 ? ipsAndHosts[1] : undefined;
      const avgRtt = rtts.length > 0 ? rtts.reduce((a, b) => a + b, 0) / rtts.length : 0;

      hops.push({ hop: hopNum, ip, rtt: Math.round(avgRtt * 100) / 100, hostname });
    }
  }

  return hops;
}

function runCommand(cmd: string, args: string[]): Promise<{ stdout: string; missing: boolean }> {
  return new Promise((resolve) => {
    let stdout = "";
    let settled = false;

    const finish = (missing: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, missing });
    };

    let proc: ReturnType<typeof spawn>;
    try {
      proc = spawn(cmd, args);
    } catch {
      resolve({ stdout: "", missing: true });
      return;
    }

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      finish(false);
    }, TIMEOUT_MS);

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    // Drain stderr so the process never blocks on a full pipe.
    proc.stderr?.on("data", () => {});

    proc.on("close", () => finish(false));
    proc.on("error", (err: NodeJS.ErrnoException) => {
      finish(err.code === "ENOENT");
    });
  });
}

export async function scanTraceroute(target: string): Promise<TracerouteResult> {
  // Prefer traceroute; fall back to tracepath when the binary is absent.
  const primary = await runCommand("traceroute", ["-n", "-w", "2", "-q", "1", target]);
  if (!primary.missing) {
    return { hops: parseTraceroute(primary.stdout), target };
  }

  const fallback = await runCommand("tracepath", ["-n", target]);
  return { hops: parseTraceroute(fallback.stdout), target };
}
