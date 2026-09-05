import { getUserIdFromRequest } from "@/lib/auth"
import * as articleService from "@/service/articleService"
import { todoService } from "@/service/todoService"
import { createApiErrorResponse } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

/**
 * ダッシュボード用集約データ取得API
 * ランダム記事・自分のアクティブTodo・他ユーザーの公開Todoを一括取得する
 * @param request リクエストオブジェクト
 * @returns { articles, activeTodos, publicTodos } またはエラーレスポンス
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const [articles, activeTodos, publicTodos] = await Promise.all([
      articleService.getRandomArticles(5),
      todoService.getActiveTodos(userId),
      todoService.getPublicTodos({ excludeUserId: userId, limit: 50 }),
    ])

    return NextResponse.json({
      articles,
      activeTodos,
      publicTodos,
    })
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "ダッシュボードデータの取得に失敗しました")
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    })
  }
}
