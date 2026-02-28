import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Vercel KV uses KV_REST_API_URL/TOKEN; direct Upstash uses UPSTASH_REDIS_REST_URL/TOKEN
// Support both — check Vercel KV first, fall back to direct Upstash env vars
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
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
