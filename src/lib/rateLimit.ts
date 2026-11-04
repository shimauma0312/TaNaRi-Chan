import { createHash } from "node:crypto"
import prisma from "@/lib/prisma"

type RateLimitRule = {
  scope: string
  identifier: string
  limit: number
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  retryAfter: number
}

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function getRateLimitClientId(request: Request): string {
  if (process.env.TRUST_PROXY !== "true") return "direct-client"

  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim()
  const value = forwarded || request.headers.get("x-real-ip")?.trim()
  return value && value.length <= 128 ? value : "unknown-client"
}

export async function consumeRateLimit(rule: RateLimitRule): Promise<RateLimitResult> {
  const now = new Date()
  const windowMs = rule.windowSeconds * 1000
  const windowNumber = Math.floor(now.getTime() / windowMs)
  const key = `${rule.scope}:${windowNumber}:${hashIdentifier(rule.identifier)}`
  const expiresAt = new Date((windowNumber + 1) * windowMs)

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 } },
    select: { count: true },
  })

  return {
    allowed: bucket.count <= rule.limit,
    retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  }
}

export async function enforceRateLimits(rules: RateLimitRule[]): Promise<RateLimitResult> {
  let longestRetryAfter = 1
  for (const rule of rules) {
    const result = await consumeRateLimit(rule)
    longestRetryAfter = Math.max(longestRetryAfter, result.retryAfter)
    if (!result.allowed) return { allowed: false, retryAfter: longestRetryAfter }
  }
  return { allowed: true, retryAfter: longestRetryAfter }
}
