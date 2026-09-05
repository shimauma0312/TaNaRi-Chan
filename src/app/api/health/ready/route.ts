import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Query both an original and a recently-added model. This makes readiness
    // fail when a persisted development node_modules volume contains a Prisma
    // Client generated from an older schema.
    await Promise.all([
      prisma.user.findFirst({ select: { id: true } }),
      prisma.rateLimitBucket.findFirst({ select: { key: true } }),
    ])
    return NextResponse.json({ status: "ready" })
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 })
  }
}
