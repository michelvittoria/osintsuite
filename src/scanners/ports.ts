import net from "net";
import type { PortResult } from "@/lib/types";

const COMMON_PORTS = [
  { port: 21, service: "ftp" },
  { port: 22, service: "ssh" },
  { port: 25, service: "smtp" },
  { port: 53, service: "dns" },
  { port: 80, service: "http" },
  { port: 110, service: "pop3" },
  { port: 143, service: "imap" },
  { port: 443, service: "https" },
  { port: 465, service: "smtps" },
  { port: 587, service: "submission" },
  { port: 993, service: "imaps" },
  { port: 995, service: "pop3s" },
  { port: 3306, service: "mysql" },
  { port: 3389, service: "rdp" },
  { port: 5432, service: "postgresql" },
  { port: 5900, service: "vnc" },
  { port: 8080, service: "http-alt" },
  { port: 8443, service: "https-alt" },
  { port: 8888, service: "http-alt2" },
  { port: 9000, service: "http-alt3" },
];

const TIMEOUT = 2000;
const CONCURRENCY = 10;

function scanPort(host: string, port: number, service: string): Promise<PortResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (result: PortResult) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(TIMEOUT);
    socket.once("connect", () => {
      finish({ port, open: true, service });
    });
    socket.once("timeout", () => {
      finish({ port, open: false, service });
    });
    socket.once("error", () => {
      finish({ port, open: false, service });
    });

    socket.connect(port, host);
  });
}

export async function scanPorts(host: string): Promise<PortResult[]> {
  const results: PortResult[] = [];
  const queue = [...COMMON_PORTS];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const result = await scanPort(host, item.port, item.service);
      results.push(result);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, COMMON_PORTS.length) }, () =>
    worker()
  );

  await Promise.all(workers);
  return results.sort((a, b) => a.port - b.port);
}