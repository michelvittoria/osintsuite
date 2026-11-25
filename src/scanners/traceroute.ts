import { spawn } from "child_process";
import { promisify } from "util";

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

interface ParseState {
  hops: TracerouteHop[];
  currentHop: number | null;
  hostnames: string[];
}

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

export async function scanTraceroute(target: string): Promise<TracerouteResult> {
  return new Promise((resolve) => {
    try {
      const proc = spawn("traceroute", ["-n", "-w", "2", "-q", "1", target]);

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const timer = setTimeout(() => {
        proc.kill("SIGTERM");
        resolve({ hops: [], target });
      }, 30000);

      proc.on("close", (code) => {
        clearTimeout(timer);
        const hops = parseTraceroute(stdout);
        resolve({ hops, target });
      });

      proc.on("error", () => {
        clearTimeout(timer);
        resolve({ hops: [], target });
      });
    } catch {
      resolve({ hops: [], target });
    }
  });
}