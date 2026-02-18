/**
 * メッセージリポジトリインターフェース
 *
 * ドメイン層で定義する依存性逆転の原則（DIP）に基づくインターフェース。
 * インフラ層の実装（Prisma等）はこのインターフェースを実装する。
 */

import { CreateMessageData, Message, MessageWithUsers } from './Message';

/**
 * メッセージリポジトリのインターフェース
 *
 * データアクセスの抽象化を提供し、ドメイン層をインフラ層から独立させる。
 */
export interface IMessageRepository {
  /**
   * メッセージを新規作成する
   *
   * @param data - 作成するメッセージのデータ
   * @returns 作成されたメッセージ（ユーザー情報付き）
   */
  create(data: CreateMessageData): Promise<MessageWithUsers>;

  /**
   * 指定ユーザーの受信トレイを取得する
   *
   * @param userId - 対象ユーザーID
   * @returns ユーザー情報付きメッセージの配列（新しい順）
   */
  findByReceiverId(userId: string): Promise<MessageWithUsers[]>;

  /**
   * 指定ユーザーの送信トレイを取得する
   *
   * @param userId - 対象ユーザーID
   * @returns ユーザー情報付きメッセージの配列（新しい順）
   */
  findBySenderId(userId: string): Promise<MessageWithUsers[]>;

  /**
   * メッセージIDでメッセージを取得する
   *
   * @param messageId - メッセージID
   * @returns ユーザー情報付きメッセージ、または`null`（存在しない場合）
   */
  findById(messageId: number): Promise<MessageWithUsers | null>;

  /**
   * メッセージを既読にする
   *
   * @param messageId - 対象メッセージID
   * @param userId    - 操作者ユーザーID（受信者のみが既読にできる）
   * @returns 更新後のメッセージ
   */
  markAsRead(messageId: number, userId: string): Promise<Message>;

  /**
   * メッセージを削除する
   *
   * @param messageId - 削除対象メッセージID
   * @param userId    - 操作者ユーザーID（送信者または受信者のみ削除可能）
   */
  delete(messageId: number, userId: string): Promise<void>;
}
