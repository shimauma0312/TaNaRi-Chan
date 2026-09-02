/**
 * メッセージ受信箱・送信APIルート
 *
 * GET  /api/messages        - 認証ユーザーの受信トレイを取得
 * POST /api/messages        - メッセージを送信
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest, isSameOriginRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PrismaMessageRepository } from '@/infrastructure/message/PrismaMessageRepository';
import { GetInboxMessagesUseCase } from '@/application/message/GetInboxMessagesUseCase';
import { SendMessageUseCase } from '@/application/message/SendMessageUseCase';
import { AppError, createApiErrorResponse } from '@/utils/errorHandler';
import { createMessageRequestSchema, firstValidationMessage, readJsonRequest } from '@/schemas/api';

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
    const userId = await getUserIdFromRequest(request);
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
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: '不正な送信元です' }, { status: 403 });
    }

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const json = await readJsonRequest(request);
    if (!json.success) {
      return NextResponse.json({ error: 'リクエスト本文が不正です' }, { status: 400 });
    }

    const parsed = createMessageRequestSchema.safeParse(json.data);
    if (!parsed.success) {
      return NextResponse.json({ error: firstValidationMessage(parsed.error) }, { status: 400 });
    }
    const { subject, body: messageBody, receiver_id } = parsed.data;

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
