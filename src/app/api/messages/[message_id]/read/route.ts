/**
 * メッセージ既読化APIルート
 *
 * PATCH /api/messages/[message_id]/read - メッセージを既読にする
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';
import { PrismaMessageRepository } from '@/infrastructure/message/PrismaMessageRepository';
import { MarkMessageAsReadUseCase } from '@/application/message/MarkMessageAsReadUseCase';
import { AppError, createApiErrorResponse, ErrorType } from '@/utils/errorHandler';

const prisma = new PrismaClient();

/**
 * メッセージを既読にする
 *
 * 受信者のみが操作可能。
 *
 * @param request - リクエストオブジェクト
 * @param params  - パスパラメータ（`message_id`）
 * @returns 更新後のメッセージ、またはエラーレスポンス
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> }
): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { message_id } = await params;
    const messageId = parseInt(message_id, 10);
    if (isNaN(messageId) || messageId <= 0) {
      throw new AppError('無効なメッセージIDです', ErrorType.VALIDATION, 400);
    }

    const repository = new PrismaMessageRepository(prisma);
    const useCase = new MarkMessageAsReadUseCase(repository);
    const message = await useCase.execute(messageId, userId);

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, 'メッセージの既読化に失敗しました');
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
    const errorResponse = createApiErrorResponse(error, 'メッセージの既読化に失敗しました');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
