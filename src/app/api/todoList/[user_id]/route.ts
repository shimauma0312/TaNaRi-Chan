import { getUserIdFromRequest } from "@/lib/auth";
import { todoService } from "@/service/todoService";
import { createApiErrorResponse } from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    user_id: string;
  };
}

/**
 * 指定ユーザーのToDoリスト取得API
 * @param request リクエストオブジェクト
 * @param params ルートパラメータ
 * @returns ユーザーのToDoリストまたはエラーレスポンス
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const requestUserId = getUserIdFromRequest(request);
    const targetUserId = params.user_id;

    // 自分のToDoリストの場合
    if (requestUserId === targetUserId) {
      const todos = await todoService.getUserTodos(targetUserId);
      return NextResponse.json(todos);
    }

    // 他人のToDoリストの場合は公開されているもののみ
    const publicTodos = await todoService.getPublicTodos();
    const userPublicTodos = publicTodos.filter(todo => todo.id === targetUserId);
    return NextResponse.json(userPublicTodos);
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'ToDoリストの取得に失敗しました');
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
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
  { params: _params }: RouteParams
): Promise<NextResponse> {
  try {
    const requestUserId = getUserIdFromRequest(request);
    if (!requestUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { todo_id, title, description, todo_deadline, is_completed, is_public } = body;

    if (!todo_id) {
      return NextResponse.json(
        { error: 'ToDoIDは必須です' },
        { status: 400 }
      );
    }

    const updatedTodo = await todoService.updateTodo(
      parseInt(todo_id),
      requestUserId,
      {
        title,
        description,
        todo_deadline: todo_deadline ? new Date(todo_deadline) : undefined,
        is_completed,
        is_public,
      }
    );

    if (!updatedTodo) {
      return NextResponse.json(
        { error: 'ToDoが見つからないか、権限がありません' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTodo);
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'ToDoの更新に失敗しました');
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
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
  { params: _params }: RouteParams
): Promise<NextResponse> {
  try {
    const requestUserId = getUserIdFromRequest(request);
    if (!requestUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const todoId = url.searchParams.get('todo_id');

    if (!todoId) {
      return NextResponse.json(
        { error: 'ToDoIDは必須です' },
        { status: 400 }
      );
    }

    const deleted = await todoService.deleteTodo(parseInt(todoId), requestUserId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'ToDoが見つからないか、権限がありません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'ToDoが削除されました' });
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'ToDoの削除に失敗しました');
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
