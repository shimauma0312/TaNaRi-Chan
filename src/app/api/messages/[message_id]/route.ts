/**
 * 個別メッセージ操作APIルート
 *
 * DELETE /api/messages/[message_id] - メッセージを削除する
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest, isSameOriginRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PrismaMessageRepository } from '@/infrastructure/message/PrismaMessageRepository';
import { DeleteMessageUseCase } from '@/application/message/DeleteMessageUseCase';
import { AppError, createApiErrorResponse, ErrorType } from '@/utils/errorHandler';
import { todoIdSchema } from '@/schemas/api';

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
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: '不正な送信元です' }, { status: 403 });
    }

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { message_id } = await params;
    const parsedMessageId = todoIdSchema.safeParse(message_id);
    if (!parsedMessageId.success) {
      throw new AppError('無効なメッセージIDです', ErrorType.VALIDATION, 400);
    }
    const messageId = parsedMessageId.data;

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
