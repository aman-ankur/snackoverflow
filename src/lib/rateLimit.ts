import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Graceful degradation: if Upstash not configured, allow all requests
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : null;

// Different tiers for different route costs
export const rateLimiters = {
  // Heavy: image analysis (expensive AI calls, multi-provider fallback)
  heavy: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "rl:heavy" })
    : null,
  // Medium: text analysis
  medium: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "rl:medium" })
    : null,
  // Light: small text generation
  light: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "rl:light" })
    : null,
};

export type RateLimitTier = keyof typeof rateLimiters;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Returns null if allowed, or a 429 NextResponse if blocked */
export async function checkRateLimit(
  request: Request,
  tier: RateLimitTier,
): Promise<NextResponse | null> {
  const limiter = rateLimiters[tier];
  if (!limiter) return null; // Upstash not configured — allow

  const ip = getClientIp(request);
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      },
    );
  }

  return null; // Allowed
}
