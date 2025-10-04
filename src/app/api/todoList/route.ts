import { getUserIdFromRequest } from "@/lib/auth";
import { todoService } from "@/service/todoService";
import { createApiErrorResponse } from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * ToDoリスト取得API
 * @returns 公開ToDoリストまたはエラーレスポンス
 */
export async function GET(): Promise<NextResponse> {
  try {
    const todos = await todoService.getPublicTodos();
    return NextResponse.json(todos);
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'ToDoリストの取得に失敗しました');
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * ToDo作成API
 * @param request リクエストオブジェクト
 * @returns 作成されたToDoまたはエラーレスポンス
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, todo_deadline, is_public } = body;

    // バリデーション
    if (!title || !description || !todo_deadline) {
      return NextResponse.json(
        { error: 'タイトル、詳細、期限は必須です' },
        { status: 400 }
      );
    }

    const todo = await todoService.createTodo(userId, {
      title,
      description,
      todo_deadline: new Date(todo_deadline),
      is_public: is_public || false,
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'ToDoの作成に失敗しました');
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
