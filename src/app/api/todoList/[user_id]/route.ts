import { NextApiRequest, NextApiResponse } from "next"
import { NextRequest, NextResponse } from "next/server"

import { PrismaClient } from "@prisma/client"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/app/firebaseConfig"
import { get } from "http"

const prisma = new PrismaClient()
export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } },
): Promise<NextResponse> {
  const todos = await getTodo(params.user_id)
  return NextResponse.json(todos)
}

// TODO: はよよ実装
// export function POST(request: NextRequest): NextResponse {
//   // POST /api/users リクエストの処理
// }

/**
 * ユーザーのToDoリストを取得する
 * @param userId : number
 */
async function getTodo(userId: string) {
  const todos = await prisma.todo.findMany({
    where: {
      user_id: userId,
    },
  })
  return todos
}