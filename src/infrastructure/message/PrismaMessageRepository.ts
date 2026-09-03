import { PrismaClient } from "@prisma/client"
import { CreateMessageData, Message, MessageWithUsers } from "@/domain/message/Message"
import { IMessageRepository } from "@/domain/message/MessageRepository"
import { AppError, ErrorType } from "@/utils/errorHandler"

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
    try {
      return await this.prisma.message.create({
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
      })
    } catch (error: any) {
      if (error?.code === "P2003") {
        throw new AppError("送信先ユーザーが存在しません", ErrorType.VALIDATION, 400)
      }
      throw error
    }
  }

  /**
   * 指定ユーザーの受信トレイを取得する（新しい順）
   *
   * @param userId - 受信者ユーザーID
   * @returns ユーザー情報付きメッセージの配列
   */
  async findByReceiverId(userId: string): Promise<MessageWithUsers[]> {
    return this.prisma.message.findMany({
      where: { receiver_id: userId, deletedByReceiver: false },
      include: {
        sender: {
          select: { id: true, user_name: true },
        },
        receiver: {
          select: { id: true, user_name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  }

  /**
   * 指定ユーザーの送信トレイを取得する（新しい順）
   *
   * @param userId - 送信者ユーザーID
   * @returns ユーザー情報付きメッセージの配列
   */
  async findBySenderId(userId: string): Promise<MessageWithUsers[]> {
    return this.prisma.message.findMany({
      where: { sender_id: userId, deletedBySender: false },
      include: {
        sender: {
          select: { id: true, user_name: true },
        },
        receiver: {
          select: { id: true, user_name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
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
    })
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
        where: { message_id: messageId, receiver_id: userId },
        data: { is_read: true },
      })
    } catch (error: any) {
      if (error?.code === "P2025") {
        throw new AppError("メッセージが見つかりません", ErrorType.NOT_FOUND, 404)
      }
      throw error
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
      const message = await this.prisma.message.findUnique({
        where: { message_id: messageId },
        select: { sender_id: true, receiver_id: true },
      })
      if (!message) throw Object.assign(new Error("Record not found"), { code: "P2025" })

      if (message.sender_id === userId) {
        await this.prisma.message.update({
          where: { message_id: messageId, sender_id: userId, deletedBySender: false },
          data: { deletedBySender: true },
        })
      } else if (message.receiver_id === userId) {
        await this.prisma.message.update({
          where: { message_id: messageId, receiver_id: userId, deletedByReceiver: false },
          data: { deletedByReceiver: true },
        })
      } else {
        throw Object.assign(new Error("Record not found"), { code: "P2025" })
      }

      // Retain the other participant's copy, then reclaim the row after both
      // mailboxes have deleted it.
      await this.prisma.message.deleteMany({
        where: { message_id: messageId, deletedBySender: true, deletedByReceiver: true },
      })
    } catch (error: any) {
      if (error?.code === "P2025") {
        throw new AppError("メッセージが見つかりません", ErrorType.NOT_FOUND, 404)
      }
      throw error
    }
  }
}
