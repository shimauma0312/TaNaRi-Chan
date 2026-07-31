/**
 * ユーザー一覧取得APIルート
 *
 * GET /api/users - 認証ユーザー以外のユーザー一覧を取得する（メッセージ送信先選択用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';
import { createApiErrorResponse } from '@/utils/errorHandler';

const prisma = new PrismaClient();

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, user_name: true },
      orderBy: { user_name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'ユーザー一覧の取得に失敗しました');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
