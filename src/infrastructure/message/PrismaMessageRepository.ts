import { PrismaClient } from '@prisma/client';
import { CreateMessageData, Message, MessageWithUsers } from '@/domain/message/Message';
import { IMessageRepository } from '@/domain/message/MessageRepository';
import { AppError, ErrorType } from '@/utils/errorHandler';

/**
 * Prismaを使ったメッセージリポジトリ実装クラス
 */
export class PrismaMessageRepository implements IMessageRepository {
  /**
   * @param prisma - PrismaClientのインスタンス
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * メッセージを新規作成する
   *
   * @param data - 作成するメッセージのデータ
   * @returns 作成されたメッセージ（ユーザー情報付き）
   */
  async create(data: CreateMessageData): Promise<MessageWithUsers> {
    return this.prisma.message.create({
      data: {
        subject: data.subject,
        body: data.body,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
      },
      include: {
        sender: {
          select: { id: true, user_name: true },
        },
        receiver: {
          select: { id: true, user_name: true },
        },
      },
    });
  }

  /**
   * 指定ユーザーの受信トレイを取得する（新しい順）
   *
   * @param userId - 受信者ユーザーID
   * @returns ユーザー情報付きメッセージの配列
   */
  async findByReceiverId(userId: string): Promise<MessageWithUsers[]> {
    return this.prisma.message.findMany({
      where: { receiver_id: userId },
      include: {
        sender: {
          select: { id: true, user_name: true },
        },
        receiver: {
          select: { id: true, user_name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 指定ユーザーの送信トレイを取得する（新しい順）
   *
   * @param userId - 送信者ユーザーID
   * @returns ユーザー情報付きメッセージの配列
   */
  async findBySenderId(userId: string): Promise<MessageWithUsers[]> {
    return this.prisma.message.findMany({
      where: { sender_id: userId },
      include: {
        sender: {
          select: { id: true, user_name: true },
        },
        receiver: {
          select: { id: true, user_name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * メッセージIDでメッセージを取得する
   *
   * @param messageId - メッセージID
   * @returns ユーザー情報付きメッセージ、または`null`
   */
  async findById(messageId: number): Promise<MessageWithUsers | null> {
    return this.prisma.message.findUnique({
      where: { message_id: messageId },
      include: {
        sender: {
          select: { id: true, user_name: true },
        },
        receiver: {
          select: { id: true, user_name: true },
        },
      },
    });
  }

  /**
   * メッセージを既読にする
   *
   * @param messageId - 対象メッセージID
   * @param userId    - 操作者ユーザーID（受信者チェックはユースケース層で実施済み）
   * @returns 更新後のメッセージ
   * @throws {AppError} メッセージが見つからない場合（NOT_FOUND, 404）
   */
  async markAsRead(messageId: number, userId: string): Promise<Message> {
    try {
      return await this.prisma.message.update({
        where: { message_id: messageId },
        data: { is_read: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError(
          'メッセージが見つかりません',
          ErrorType.NOT_FOUND,
          404
        );
      }
      throw error;
    }
  }

  /**
   * メッセージを削除する
   *
   * @param messageId - 削除対象メッセージID
   * @param userId    - 操作者ユーザーID（権限チェックはユースケース層で実施済み）
   * @throws {AppError} メッセージが見つからない場合（NOT_FOUND, 404）
   */
  async delete(messageId: number, userId: string): Promise<void> {
    try {
      await this.prisma.message.delete({
        where: { message_id: messageId },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError(
          'メッセージが見つかりません',
          ErrorType.NOT_FOUND,
          404
        );
      }
      throw error;
    }
  }
}
