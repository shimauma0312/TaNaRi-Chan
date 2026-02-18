/**
 * 送信メッセージ一覧取得APIルート
 *
 * GET /api/messages/sent - 認証ユーザーの送信トレイを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';
import { PrismaMessageRepository } from '@/infrastructure/message/PrismaMessageRepository';
import { GetSentMessagesUseCase } from '@/application/message/GetSentMessagesUseCase';
import { AppError, createApiErrorResponse } from '@/utils/errorHandler';

const prisma = new PrismaClient();

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * 送信メッセージ一覧を取得する
 *
 * @param request - リクエストオブジェクト
 * @returns ユーザー情報付き送信メッセージの配列、またはエラーレスポンス
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const repository = new PrismaMessageRepository(prisma);
    const useCase = new GetSentMessagesUseCase(repository);
    const messages = await useCase.execute(userId);

    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, '送信メッセージの取得に失敗しました');
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
    const errorResponse = createApiErrorResponse(error, '送信メッセージの取得に失敗しました');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
