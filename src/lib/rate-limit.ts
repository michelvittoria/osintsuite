import { getRedis, KEYS, TTL } from "./redis";

const PER_MINUTE = 5;
const PER_DAY = 50;

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  remainingMinute: number;
  remainingDay: number;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const redis = getRedis();
  const minuteKey = KEYS.rateLimit(ip);
  const dayKey = KEYS.dailyLimit(ip);

  const [minuteCount, dayCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(dayKey),
  ]);

  if (minuteCount === 1) await redis.expire(minuteKey, TTL.rateLimit);
  if (dayCount === 1) await redis.expire(dayKey, TTL.dailyLimit);

  if (minuteCount > PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit: max ${PER_MINUTE} scans per minute`,
      remainingMinute: 0,
      remainingDay: Math.max(0, PER_DAY - dayCount),
    };
  }

  if (dayCount > PER_DAY) {
    return {
      allowed: false,
      reason: `Daily limit: max ${PER_DAY} scans per day`,
      remainingMinute: Math.max(0, PER_MINUTE - minuteCount),
      remainingDay: 0,
    };
  }

  return {
    allowed: true,
    remainingMinute: PER_MINUTE - minuteCount,
    remainingDay: PER_DAY - dayCount,
  };
}

export function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}