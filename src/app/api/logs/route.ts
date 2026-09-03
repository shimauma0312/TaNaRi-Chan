import { getUserIdFromRequest, isSameOriginRequest } from "@/lib/auth"
import { writeLogToDB } from "@/lib/dbLogger"
import { LogLevel, LogSource } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const MAX_REQUEST_BYTES = 16 * 1024
const MAX_CONTEXT_BYTES = 8 * 1024

const clientLogInput = z.object({
  level: z.nativeEnum(LogLevel),
  message: z.string().trim().min(1).max(2_000),
  context: z.record(z.unknown()).optional(),
})

function jsonSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

function refererPath(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).pathname.slice(0, 2_048)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Cross-origin request is not allowed" }, { status: 403 })
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const declaredLength = Number(request.headers.get("content-length"))
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Log payload is too large" }, { status: 413 })
    }

    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Log payload is too large" }, { status: 413 })
    }

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 })
    }

    const parsed = clientLogInput.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid log payload" }, { status: 400 })
    }
    if (parsed.data.context && jsonSize(parsed.data.context) > MAX_CONTEXT_BYTES) {
      return NextResponse.json({ error: "Log context is too large" }, { status: 413 })
    }

    await writeLogToDB({
      ...parsed.data,
      source: LogSource.CLIENT,
      // Never trust a userId supplied by client JSON.
      userId,
      path: refererPath(request.headers.get("referer")),
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/logs] error:", error)
    return NextResponse.json({ error: "Failed to record log" }, { status: 500 })
  }
}
