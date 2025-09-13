import { getTodo } from "@/service/todoService"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> },
): Promise<NextResponse> {
  const { user_id } = await params
  const todos = await getTodo(user_id)
  return NextResponse.json(todos)
}

// TODO: はよよ実装
// export function POST(request: NextRequest): NextResponse {
//   // POST /api/users リクエストの処理
// }
