import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

type Window = `${number} ${'s' | 'm' | 'h' | 'd'}`

const redis = Redis.fromEnv()
const limiters = new Map<string, Ratelimit>()

function getLimiter(name: string, limit: number, window: Window) {
  const key = `${name}:${limit}:${window}`
  let l = limiters.get(key)
  if (!l) {
    l = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `bitvora:${name}`,
    })
    limiters.set(key, l)
  }
  return l
}

export async function getClientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

/**
 * failOpen: true  -> if Redis is down, let the request through (public pages)
 * failOpen: false -> if Redis is down, block (anything that costs money)
 */
export async function rateLimit(
  name: string,
  identifier: string,
  limit: number,
  window: Window,
  { failOpen = true }: { failOpen?: boolean } = {}
) {
  try {
    const { success, reset } = await getLimiter(name, limit, window).limit(identifier)
    return { ok: success, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) }
  } catch (err) {
    console.error('rate limit check failed', err)
    return { ok: failOpen, retryAfter: 60 }
  }
}