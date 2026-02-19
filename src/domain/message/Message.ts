/**
 * メッセージドメインエンティティ
 *
 * ドメイン層のコアエンティティ。外部フレームワーク（Prisma等）に依存しない純粋なビジネスオブジェクト。
 */

/**
 * メッセージエンティティのインターフェース
 *
 * @property message_id  - メッセージの一意識別子
 * @property subject     - メッセージの件名
 * @property body        - メッセージ本文
 * @property sender_id   - 送信者のユーザーID
 * @property receiver_id - 受信者のユーザーID
 * @property is_read     - 既読フラグ
 * @property createdAt   - 送信日時
 */
export interface Message {
  readonly message_id: number;
  readonly subject: string;
  readonly body: string;
  readonly sender_id: string;
  readonly receiver_id: string;
  readonly is_read: boolean;
  readonly createdAt: Date;
}

/**
 * メッセージ送信者情報の型
 *
 * @property id        - ユーザーID
 * @property user_name - ユーザー名
 */
export interface MessageUserInfo {
  readonly id: string;
  readonly user_name: string;
}

/**
 * ユーザー情報付きメッセージエンティティ
 *
 * API レスポンス等、送受信者の詳細情報が必要な場合に使用する。
 */
export interface MessageWithUsers extends Message {
  readonly sender: MessageUserInfo;
  readonly receiver: MessageUserInfo;
}

/**
 * メッセージ作成に必要なデータ型
 *
 * @property subject     - 件名
 * @property body        - 本文
 * @property sender_id   - 送信者ID
 * @property receiver_id - 受信者ID
 */
export interface CreateMessageData {
  readonly subject: string;
  readonly body: string;
  readonly sender_id: string;
  readonly receiver_id: string;
}

/**
 * メッセージバリデーション結果の型
 *
 * @property isValid - バリデーション結果
 * @property errors  - エラーメッセージの配列
 */
export interface MessageValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
}

/**
 * メッセージドメインのビジネスルールを実装するクラス
 *
 * このクラスは外部（DB・フレームワーク）に一切依存しない純粋な関数群で構成される。
 * Application層がApplication層のオーケストレーション内でこれらのルールを呼び出す
 * 「Sandwich」パターンの中心となる Domain Logic 担当者。
 */
export class MessageEntity {
  /** 件名の最大文字数 */
  static readonly MAX_SUBJECT_LENGTH = 200;
  /** 本文の最大文字数 */
  static readonly MAX_BODY_LENGTH = 10000;

  /**
   * メッセージ作成データのバリデーションを実施する
   *
   * @param data - バリデーション対象のメッセージデータ
   * @returns バリデーション結果オブジェクト
   */
  static validate(data: CreateMessageData): MessageValidationResult {
    const errors: string[] = [];

    if (!data.subject || data.subject.trim().length === 0) {
      errors.push('件名は必須です');
    } else if (data.subject.length > MessageEntity.MAX_SUBJECT_LENGTH) {
      errors.push(`件名は${MessageEntity.MAX_SUBJECT_LENGTH}文字以内で入力してください`);
    }

    if (!data.body || data.body.trim().length === 0) {
      errors.push('本文は必須です');
    } else if (data.body.length > MessageEntity.MAX_BODY_LENGTH) {
      errors.push(`本文は${MessageEntity.MAX_BODY_LENGTH}文字以内で入力してください`);
    }

    if (!data.sender_id || data.sender_id.trim().length === 0) {
      errors.push('送信者IDは必須です');
    }

    if (!data.receiver_id || data.receiver_id.trim().length === 0) {
      errors.push('受信者IDは必須です');
    }

    if (data.sender_id && data.receiver_id && data.sender_id === data.receiver_id) {
      errors.push('自分自身にメッセージを送ることはできません');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 指定ユーザーがメッセージを既読にできるかを判定する（純粋関数）
   *
   * ビジネスルール: 受信者のみが既読にできる。
   * Application層はこの関数を呼び出してルールの適用を Domain層に委譲する。
   *
   * @param message - 判定対象のメッセージ
   * @param userId  - 操作を試みるユーザーID
   * @returns 受信者であれば `true`、そうでなければ `false`
   */
  static canMarkAsRead(message: Pick<Message, 'receiver_id'>, userId: string): boolean {
    return message.receiver_id === userId;
  }

  /**
   * 指定ユーザーがメッセージを削除できるかを判定する（純粋関数）
   *
   * ビジネスルール: 送信者または受信者のみが削除できる。
   * Application層はこの関数を呼び出してルールの適用を Domain層に委譲する。
   *
   * @param message - 判定対象のメッセージ
   * @param userId  - 操作を試みるユーザーID
   * @returns 送信者または受信者であれば `true`、そうでなければ `false`
   */
  static canDelete(message: Pick<Message, 'sender_id' | 'receiver_id'>, userId: string): boolean {
    return message.sender_id === userId || message.receiver_id === userId;
  }
}
