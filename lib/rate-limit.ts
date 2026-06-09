import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiter for API routes.
 * Limits each user to 10 requests per 10 seconds.
 * Uses Upstash Redis for distributed rate limiting.
 */
export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

/**
 * Check rate limit for a given identifier (user ID or IP).
 * Returns true if the request should be allowed.
 */
export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean
  remaining: number
  reset: number
}> {
  const { success, remaining, reset } = await rateLimiter.limit(identifier)
  return { allowed: success, remaining, reset }
}