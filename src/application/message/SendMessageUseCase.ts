/**
 * メッセージ送信ユースケース
 */

import { MessageEntity, MessageWithUsers, CreateMessageData } from '@/domain/message/Message';
import { IMessageRepository } from '@/domain/message/MessageRepository';
import { AppError, ErrorType } from '@/utils/errorHandler';

/**
 * メッセージ送信ユースケースの入力型
 *
 * @property subject     - 件名
 * @property body        - 本文
 * @property sender_id   - 送信者ユーザーID
 * @property receiver_id - 受信者ユーザーID
 */
export interface SendMessageInput {
  subject: string;
  body: string;
  sender_id: string;
  receiver_id: string;
}

/**
 * メッセージ送信ユースケースクラス
 */
export class SendMessageUseCase {
  /**
   * @param messageRepository - メッセージリポジトリのインスタンス
   */
  constructor(private readonly messageRepository: IMessageRepository) {}

  /**
   * メッセージを送信する
   *
   * @param input - 送信するメッセージのデータ
   * @returns 作成されたメッセージ（ユーザー情報付き）
   * @throws {AppError} バリデーションエラーの場合（VALIDATION, 400）
   * @throws {AppError} データベースエラーの場合（DATABASE_ERROR, 500）
   */
  async execute(input: SendMessageInput): Promise<MessageWithUsers> {
    const data: CreateMessageData = {
      subject: input.subject,
      body: input.body,
      sender_id: input.sender_id,
      receiver_id: input.receiver_id,
    };

    const validation = MessageEntity.validate(data);
    if (!validation.isValid) {
      throw new AppError(
        validation.errors.join(', '),
        ErrorType.VALIDATION,
        400
      );
    }

    try {
      return await this.messageRepository.create(data);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'メッセージの送信に失敗しました',
        ErrorType.DATABASE_ERROR,
        500
      );
    }
  }
}
