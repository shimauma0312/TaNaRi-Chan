/**
 * クライアントサイド専用のエラーハンドリングユーティリティ
 */

// エラーの種類を定義
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * カスタムエラークラス
 *
 * @example
 * throw new AppError('ユーザーが見つかりません', ErrorType.NOT_FOUND, 404);
 * throw new AppError('メールアドレスの形式が不正です', ErrorType.VALIDATION, 400);
 * throw new AppError('データベース接続に失敗しました', ErrorType.DATABASE_ERROR, 500);
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  /**
   * @param message エラーメッセージ
   * @param type エラータイプ (デフォルト: SERVER_ERROR)
   * @param statusCode HTTPステータスコード (デフォルト: 500)
   * @param isOperational 運用エラーかどうか (デフォルト: true)
   */
  constructor(
    message: string,
    type: ErrorType = ErrorType.SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * フロントエンド用のエラー処理ユーティリティ関数
 * @param error - 発生したエラー
 * @param fallbackMessage - デフォルトメッセージ
 * @returns ユーザー向けエラーメッセージ
 */
export const handleClientError = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof AppError) {
    console.error('Client Error:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
    });
    return error.message;
  }

  if (error instanceof Error) {
    console.error('Unexpected Client Error:', error.message);
    return error.message;
  }

  console.error('Unknown Client Error:', error);
  return fallbackMessage;
};
