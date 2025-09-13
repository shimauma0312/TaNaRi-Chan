import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()
export async function GET(): Promise<NextResponse> {
  const todos = await getTodo()
  return NextResponse.json(todos)
}

/**
 * ユーザーのToDoリストを取得する
 * @param userId : number
 */
async function getTodo() {
  return await prisma.todo.findMany()
}
