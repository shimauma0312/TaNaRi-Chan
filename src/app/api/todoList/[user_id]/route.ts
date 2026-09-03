import { getUserIdFromRequest, isSameOriginRequest } from "@/lib/auth"
import { todoService } from "@/service/todoService"
import { createApiErrorResponse } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import {
  firstValidationMessage,
  readJsonRequest,
  todoIdSchema,
  updateTodoRequestSchema,
} from "@/schemas/api"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{
    user_id: string
  }>
}

/**
 * 指定ユーザーのToDoリスト取得API
 * @param request リクエストオブジェクト
 * @param params ルートパラメータ
 * @returns ユーザーのToDoリストまたはエラーレスポンス
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const requestUserId = await getUserIdFromRequest(request)
    const { user_id: targetUserId } = await params

    // 自分のToDoリストの場合
    if (requestUserId === targetUserId) {
      const todos = await todoService.getUserTodos(targetUserId)
      return NextResponse.json(todos)
    }

    // 他人のToDoリストの場合は公開されているもののみ
    const publicTodos = await todoService.getPublicTodos({ userId: targetUserId })
    return NextResponse.json(publicTodos)
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "ToDoリストの取得に失敗しました")
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.statusCode })
  }
}

/**
 * 指定ToDoの更新API
 * @param request リクエストオブジェクト
 * @param params ルートパラメータ
 * @returns 更新されたToDoまたはエラーレスポンス
 */
export async function PUT(
  request: NextRequest,
  { params: _params }: RouteParams,
): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "不正な送信元です" }, { status: 403 })
    }

    const requestUserId = await getUserIdFromRequest(request)
    if (!requestUserId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const json = await readJsonRequest(request)
    if (!json.success) {
      return NextResponse.json({ error: json.error }, { status: json.status })
    }

    const parsed = updateTodoRequestSchema.safeParse(json.data)
    if (!parsed.success) {
      return NextResponse.json({ error: firstValidationMessage(parsed.error) }, { status: 400 })
    }
    const { todo_id, title, description, todo_deadline, is_completed, is_public } = parsed.data

    const updatedTodo = await todoService.updateTodo(todo_id, requestUserId, {
      title,
      description,
      todo_deadline,
      is_completed,
      is_public,
    })

    if (!updatedTodo) {
      return NextResponse.json({ error: "ToDoが見つからないか、権限がありません" }, { status: 404 })
    }

    return NextResponse.json(updatedTodo)
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "ToDoの更新に失敗しました")
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.statusCode })
  }
}

/**
 * 指定ToDoの削除API
 * @param request リクエストオブジェクト
 * @param params ルートパラメータ
 * @returns 削除結果またはエラーレスポンス
 */
export async function DELETE(
  request: NextRequest,
  { params: _params }: RouteParams,
): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "不正な送信元です" }, { status: 403 })
    }

    const requestUserId = await getUserIdFromRequest(request)
    if (!requestUserId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const url = new URL(request.url)
    const parsedTodoId = todoIdSchema.safeParse(url.searchParams.get("todo_id"))

    if (!parsedTodoId.success) {
      return NextResponse.json({ error: "ToDoIDは必須です" }, { status: 400 })
    }

    const deleted = await todoService.deleteTodo(parsedTodoId.data, requestUserId)

    if (!deleted) {
      return NextResponse.json({ error: "ToDoが見つからないか、権限がありません" }, { status: 404 })
    }

    return NextResponse.json({ message: "ToDoが削除されました" })
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "ToDoの削除に失敗しました")
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.statusCode })
  }
}
