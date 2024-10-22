import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

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
