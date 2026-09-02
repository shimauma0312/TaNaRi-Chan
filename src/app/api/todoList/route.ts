import { getUserIdFromRequest, isSameOriginRequest } from "@/lib/auth"
import { todoService } from "@/service/todoService"
import { createApiErrorResponse } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import { createTodoRequestSchema, firstValidationMessage } from "@/schemas/api"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

/**
 * ToDoリスト取得API
 * @returns 公開ToDoリストまたはエラーレスポンス
 */
export async function GET(): Promise<NextResponse> {
  try {
    const todos = await todoService.getPublicTodos()
    return NextResponse.json(todos)
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "ToDoリストの取得に失敗しました")
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.statusCode })
  }
}

/**
 * ToDo作成API
 * @param request リクエストオブジェクト
 * @returns 作成されたToDoまたはエラーレスポンス
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "不正な送信元です" }, { status: 403 })
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const parsed = createTodoRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: firstValidationMessage(parsed.error) }, { status: 400 })
    }
    const { title, description, todo_deadline, is_public } = parsed.data

    const todo = await todoService.createTodo(userId, {
      title,
      description,
      todo_deadline,
      is_public,
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "ToDoの作成に失敗しました")
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.statusCode })
  }
}
