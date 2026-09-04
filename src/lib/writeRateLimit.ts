import { consumeRateLimit } from "@/lib/rateLimit"
import { NextResponse } from "next/server"

interface WriteRateLimitOptions {
  scope: string
  limit: number
  windowSeconds: number
}

/** Apply a shared, per-account limit and return the HTTP response when blocked. */
export async function enforceWriteRateLimit(
  userId: string,
  options: WriteRateLimitOptions,
): Promise<NextResponse | null> {
  const result = await consumeRateLimit({
    ...options,
    identifier: userId,
  })

  if (result.allowed) return null

  return NextResponse.json(
    { error: "リクエストが多すぎます。しばらくしてから再試行してください" },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
  )
}
