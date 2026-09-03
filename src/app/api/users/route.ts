/**
 * ユーザー一覧取得APIルート
 *
 * GET /api/users - 認証ユーザー以外のユーザー一覧を取得する（メッセージ送信先選択用）
 */

import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createApiErrorResponse } from "@/utils/errorHandler"
import { z } from "zod"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

const userQuery = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

/**
 * ユーザー一覧を取得する（自分自身を除く）
 *
 * メッセージ送信先選択などに使用するため、認証ユーザー以外のユーザーを返す。
 *
 * @param request - リクエストオブジェクト
 * @returns ユーザーの配列（id, user_name のみ）、またはエラーレスポンス
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const url = new URL(request.url)
    const parsed = userQuery.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "検索条件が不正です" }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        ...(parsed.data.q
          ? { user_name: { contains: parsed.data.q, mode: "insensitive" as const } }
          : {}),
      },
      select: { id: true, user_name: true },
      orderBy: { user_name: "asc" },
      take: parsed.data.limit ?? 20,
    })

    return NextResponse.json(users)
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "ユーザー一覧の取得に失敗しました")
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
