/**
 * メッセージ受信箱・送信APIルート
 *
 * GET  /api/messages        - 認証ユーザーの受信トレイを取得
 * POST /api/messages        - メッセージを送信
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';
import { PrismaMessageRepository } from '@/infrastructure/message/PrismaMessageRepository';
import { GetInboxMessagesUseCase } from '@/application/message/GetInboxMessagesUseCase';
import { SendMessageUseCase } from '@/application/message/SendMessageUseCase';
import { AppError, createApiErrorResponse } from '@/utils/errorHandler';

const prisma = new PrismaClient();

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * 受信メッセージ一覧を取得する
 *
 * @param request - リクエストオブジェクト
 * @returns ユーザー情報付きメッセージの配列、またはエラーレスポンス
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const repository = new PrismaMessageRepository(prisma);
    const useCase = new GetInboxMessagesUseCase(repository);
    const messages = await useCase.execute(userId);

    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, '受信メッセージの取得に失敗しました');
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
    const errorResponse = createApiErrorResponse(error, '受信メッセージの取得に失敗しました');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

/**
 * メッセージを送信する
 *
 * @param request - リクエストオブジェクト（body: { subject, body, receiver_id }）
 * @returns 作成されたメッセージ（ユーザー情報付き）、またはエラーレスポンス
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, body: messageBody, receiver_id } = body;

    const repository = new PrismaMessageRepository(prisma);
    const useCase = new SendMessageUseCase(repository);
    const message = await useCase.execute({
      subject,
      body: messageBody,
      sender_id: userId,
      receiver_id,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, 'メッセージの送信に失敗しました');
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
    const errorResponse = createApiErrorResponse(error, 'メッセージの送信に失敗しました');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
