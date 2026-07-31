/**
 * 個別メッセージ操作APIルート
 *
 * DELETE /api/messages/[message_id] - メッセージを削除する
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';
import { PrismaMessageRepository } from '@/infrastructure/message/PrismaMessageRepository';
import { DeleteMessageUseCase } from '@/application/message/DeleteMessageUseCase';
import { AppError, createApiErrorResponse, ErrorType } from '@/utils/errorHandler';

const prisma = new PrismaClient();

/**
 * メッセージを削除する
 *
 * 送信者または受信者のみが削除可能。
 *
 * @param request - リクエストオブジェクト
 * @param params  - パスパラメータ（`message_id`）
 * @returns 削除成功レスポンス、またはエラーレスポンス
 */
export async function DELETE(
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
    const useCase = new DeleteMessageUseCase(repository);
    await useCase.execute(messageId, userId);

    return NextResponse.json({ message: 'メッセージを削除しました' });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, 'メッセージの削除に失敗しました');
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
    const errorResponse = createApiErrorResponse(error, 'メッセージの削除に失敗しました');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
