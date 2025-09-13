import { getTodo } from "@/service/todoService"
import { NextRequest, NextResponse } from "next/server"
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const todos = await getTodo(params.id)
  return NextResponse.json(todos)
}

// TODO: はよよ実装
// export function POST(request: NextRequest): NextResponse {
//   // POST /api/users リクエストの処理
// }
