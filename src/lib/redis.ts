import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    client.on("error", (err) => {
      console.error("[redis] error:", err.message);
    });
  }
  return client;
}

export const KEYS = {
  job: (id: string) => `job:${id}`,
  cache: (targetType: string, value: string) => `cache:${targetType}:${value}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
  dailyLimit: (ip: string) => `daily:${ip}`,
};

export const TTL = {
  job: 3600, // 1h
  cache: 86400, // 24h
  rateLimit: 60, // 1min window
  dailyLimit: 86400, // 24h
};