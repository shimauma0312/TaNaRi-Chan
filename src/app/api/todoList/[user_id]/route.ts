import { NextApiRequest, NextApiResponse } from "next"
import { NextRequest, NextResponse } from "next/server"
import { getTodo } from "@/service/todoService"
import { PrismaClient } from "@prisma/client"
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
