/**
 * メッセージ削除ユースケース
 *
 * 指定メッセージを削除する。送信者または受信者のみが操作可能。
 *
 * Application層のオーケストレーション（Sandwich構造）:
 *   1. Infrastructure層からメッセージを取得
 *   2. Domain層のビジネスルールで権限を検証
 *   3. 問題なければInfrastructure層に削除を委譲
 */

import { MessageEntity } from '@/domain/message/Message';
import { IMessageRepository } from '@/domain/message/MessageRepository';
import { AppError, ErrorType } from '@/utils/errorHandler';

/**
 * メッセージ削除ユースケースクラス
 */
export class DeleteMessageUseCase {
  /**
   * @param messageRepository - メッセージリポジトリのインスタンス
   */
  constructor(private readonly messageRepository: IMessageRepository) {}

  /**
   * メッセージを削除する
   *
   * 送信者または受信者のみが削除操作を行える。対象メッセージが存在しない場合、
   * または操作者が関係者でない場合はエラーを返す。
   *
   * @param messageId - 削除するメッセージのID
   * @param userId    - 操作者ユーザーID（送信者または受信者のみ許可）
   * @throws {AppError} メッセージが存在しない場合（NOT_FOUND, 404）
   * @throws {AppError} 操作者が関係者でない場合（AUTHORIZATION, 403）
   * @throws {AppError} データベースエラーの場合（DATABASE_ERROR, 500）
   */
  async execute(messageId: number, userId: string): Promise<void> {
    // Step 1: Infrastructure層からデータ取得
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new AppError(
        'メッセージが見つかりません',
        ErrorType.NOT_FOUND,
        404
      );
    }

    // Step 2: Domain層のビジネスルールで権限を検証（純粋関数への委譲）
    if (!MessageEntity.canDelete(message, userId)) {
      throw new AppError(
        'このメッセージを削除する権限がありません',
        ErrorType.AUTHORIZATION,
        403
      );
    }

    // Step 3: Infrastructure層に削除を委譲
    try {
      await this.messageRepository.delete(messageId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'メッセージの削除に失敗しました',
        ErrorType.DATABASE_ERROR,
        500
      );
    }
  }
}
