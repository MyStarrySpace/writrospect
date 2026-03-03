/**
 * Rate Limiting
 *
 * Uses @upstash/ratelimit with Redis for distributed rate limiting.
 * Falls back to a no-op if UPSTASH_REDIS_REST_URL is not configured,
 * so the app still works in development without Redis.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

/**
 * Pre-configured rate limiters for different route types.
 * Returns null if Redis is not configured.
 */
function createLimiter(config: { requests: number; window: string }) {
  const r = getRedis();
  if (!r) return null;

  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(config.requests, config.window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: false,
  });
}

// Billing mutation routes: 10 requests per minute per user
const billingMutationLimiter = () => createLimiter({ requests: 10, window: "1 m" });

// Billing read routes: 30 requests per minute per user
const billingReadLimiter = () => createLimiter({ requests: 30, window: "1 m" });

// Chat route: 20 requests per minute per user
const chatLimiter = () => createLimiter({ requests: 20, window: "1 m" });

export type RateLimitType = "billing-mutation" | "billing-read" | "chat";

const limiterMap: Record<RateLimitType, () => Ratelimit | null> = {
  "billing-mutation": billingMutationLimiter,
  "billing-read": billingReadLimiter,
  "chat": chatLimiter,
};

/**
 * Check rate limit for a user. Returns a 429 response if limited, or null if OK.
 * If Redis is not configured, always allows the request (no-op).
 */
export async function checkRateLimit(
  userId: string,
  type: RateLimitType
): Promise<NextResponse | null> {
  const limiter = limiterMap[type]();
  if (!limiter) return null; // Redis not configured, allow

  const { success, reset } = await limiter.limit(`${type}:${userId}`);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  return null;
}
