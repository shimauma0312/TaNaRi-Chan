import { getUserIdFromRequest, isSameOriginRequest } from "@/lib/auth"
import { todoService } from "@/service/todoService"
import { createApiErrorResponse } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import { createTodoRequestSchema, firstValidationMessage, readJsonRequest } from "@/schemas/api"
import { z } from "zod"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

/**
 * ToDoリスト取得API
 * @returns 公開ToDoリストまたはエラーレスポンス
 */
const paginationQuery = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export async function GET(request?: NextRequest): Promise<NextResponse> {
  try {
    const url = request ? new URL(request.url) : null
    const parsed = paginationQuery.safeParse({
      cursor: url?.searchParams.get("cursor") ?? undefined,
      limit: url?.searchParams.get("limit") ?? undefined,
    })
    if (!parsed.success)
      return NextResponse.json({ error: "ページ指定が不正です" }, { status: 400 })

    const currentUserId = request ? await getUserIdFromRequest(request) : null
    const todos = await todoService.getPublicTodos({
      ...parsed.data,
      excludeUserId: currentUserId ?? undefined,
    })
    const response = NextResponse.json(todos)
    if (parsed.data.limit && todos.length === parsed.data.limit) {
      response.headers.set("X-Next-Cursor", String(todos.at(-1)?.todo_id))
    }
    return response
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

    const json = await readJsonRequest(request)
    if (!json.success) {
      return NextResponse.json({ error: json.error }, { status: json.status })
    }

    const parsed = createTodoRequestSchema.safeParse(json.data)
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
