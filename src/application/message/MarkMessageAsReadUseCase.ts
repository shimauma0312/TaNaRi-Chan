/**
 * メッセージ既読化ユースケース
 *
 * 指定メッセージを既読状態に更新する。受信者のみが操作可能。
 *
 * Application層のオーケストレーション（Sandwich構造）:
 *   1. Infrastructure層からメッセージを取得
 *   2. Domain層のビジネスルールで権限を検証
 *   3. 問題なければInfrastructure層に永続化を委譲
 */

import { Message, MessageEntity } from '@/domain/message/Message';
import { IMessageRepository } from '@/domain/message/MessageRepository';
import { AppError, ErrorType } from '@/utils/errorHandler';

/**
 * メッセージ既読化ユースケースクラス
 */
export class MarkMessageAsReadUseCase {
  /**
   * @param messageRepository - メッセージリポジトリのインスタンス
   */
  constructor(private readonly messageRepository: IMessageRepository) {}

  /**
   * メッセージを既読にする
   *
   * 受信者のみが既読操作を行える。対象メッセージが存在しない場合、
   * または操作者が受信者でない場合はエラーを返す。
   *
   * @param messageId - 既読にするメッセージのID
   * @param userId    - 操作者ユーザーID（受信者のみ許可）
   * @returns 更新後のメッセージ
   * @throws {AppError} メッセージが存在しない場合（NOT_FOUND, 404）
   * @throws {AppError} 受信者でない場合（AUTHORIZATION, 403）
   * @throws {AppError} データベースエラーの場合（DATABASE_ERROR, 500）
   */
  async execute(messageId: number, userId: string): Promise<Message> {
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
    if (!MessageEntity.canMarkAsRead(message, userId)) {
      throw new AppError(
        'このメッセージを既読にする権限がありません',
        ErrorType.AUTHORIZATION,
        403
      );
    }

    // Step 3: Infrastructure層に永続化を委譲
    try {
      return await this.messageRepository.markAsRead(messageId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'メッセージの既読化に失敗しました',
        ErrorType.DATABASE_ERROR,
        500
      );
    }
  }
}
