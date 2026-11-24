import tls from "tls";
import type { SslResult } from "@/lib/types";

const TIMEOUT = 10000;

export async function scanSsl(domain: string): Promise<SslResult> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout: TIMEOUT,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol() || "unknown";

        if (!cert || !cert.subject) {
          socket.destroy();
          reject(new Error("No certificate received"));
          return;
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.floor(
          (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const sans = cert.subjectaltname
          ? cert.subjectaltname
              .split(",")
              .map((s) => s.trim().replace(/^DNS:/, ""))
          : [];

        const result: SslResult = {
          subject: formatName(cert.subject),
          issuer: formatName(cert.issuer),
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysRemaining,
          serialNumber: cert.serialNumber || "",
          sans,
          protocol,
        };

        socket.destroy();
        resolve(result);
      }
    );

    socket.on("error", (err) => {
      socket.destroy();
      reject(new Error(`SSL error: ${err.message}`));
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("SSL timeout"));
    });
  });
}

function formatName(name: Record<string, string | string[] | undefined> | undefined): string {
  if (!name) return "unknown";
  const cn = name.CN;
  if (typeof cn === "string") return cn;
  const o = name.O;
  if (typeof o === "string") return o;
  return Object.values(name)
    .flat()
    .filter((v): v is string => typeof v === "string")
    .join(", ");
}