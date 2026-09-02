import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await prisma.user.findFirst({ select: { id: true } })
    return NextResponse.json({ status: "ready" })
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 })
  }
}
