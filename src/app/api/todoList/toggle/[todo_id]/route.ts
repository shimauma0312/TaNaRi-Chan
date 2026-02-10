import { getUserIdFromRequest } from "@/lib/auth";
import { todoService } from "@/service/todoService";
import { createApiErrorResponse } from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    todo_id: string;
  }>;
}

/**
 * ToDoの完了状態切り替えAPI
 * @param request リクエストオブジェクト
 * @param params ルートパラメータ
 * @returns 更新されたToDoまたはエラーレスポンス
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const requestUserId = getUserIdFromRequest(request);
    if (!requestUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { todo_id } = await params;
    const todoId = parseInt(todo_id);
    if (isNaN(todoId)) {
      return NextResponse.json(
        { error: '無効なToDoIDです' },
        { status: 400 }
      );
    }

    const updatedTodo = await todoService.toggleTodoCompletion(todoId, requestUserId);

    if (!updatedTodo) {
      return NextResponse.json(
        { error: 'ToDoが見つからないか、権限がありません' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTodo);
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'ToDoの完了状態の切り替えに失敗しました');
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}