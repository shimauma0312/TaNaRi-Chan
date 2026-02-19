/**
 * 受信メッセージ取得ユースケース
 *
 * 指定ユーザーの受信トレイにあるメッセージ一覧を取得する。
 */

import { MessageWithUsers } from '@/domain/message/Message';
import { IMessageRepository } from '@/domain/message/MessageRepository';
import { AppError, ErrorType } from '@/utils/errorHandler';

/**
 * 受信メッセージ取得ユースケースクラス
 */
export class GetInboxMessagesUseCase {
  /**
   * @param messageRepository - メッセージリポジトリのインスタンス
   */
  constructor(private readonly messageRepository: IMessageRepository) {}

  /**
   * 受信トレイのメッセージ一覧を取得する
   *
   * @param userId - 対象ユーザーID
   * @returns ユーザー情報付きメッセージの配列（新しい順）
   * @throws {AppError} ユーザーIDが不正な場合（VALIDATION, 400）
   * @throws {AppError} データベースエラーの場合（DATABASE_ERROR, 500）
   */
  async execute(userId: string): Promise<MessageWithUsers[]> {
    if (!userId || userId.trim().length === 0) {
      throw new AppError(
        'ユーザーIDは必須です',
        ErrorType.VALIDATION,
        400
      );
    }

    try {
      return await this.messageRepository.findByReceiverId(userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        '受信メッセージの取得に失敗しました',
        ErrorType.DATABASE_ERROR,
        500
      );
    }
  }
}
