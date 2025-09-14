/**
 * エラーハンドリングユーティリティ
 */

import logger from '@/utils/logger';

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
 * Prismaエラー型
 */
export interface PrismaError extends Error {
  /** Prismaエラーコード (例: P2002, P2003, P2025) */
  code: string;
  /** エラーメタ */
  meta?: {
    /** 対象フィールド名 */
    target?: string | string[];
    /** 制約名 */
    constraint?: string;
    /** 詳細 */
    [key: string]: any;
  };
  /** クライアントバージョン */
  clientVersion?: string;
  /** その他プロパティ */
  [key: string]: any;
}

/**
 * ネットワークエラーの型定義
 */
export interface NetworkError extends Error {
  /** エラーの名前 */
  name: string;
  /** エラーメッセージ */
  message: string;
  /** その他のプロパティ */
  [key: string]: any;
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

    Error.captureStackTrace(this, this.constructor);
  }
}

// API エラーレスポンス型
export interface ApiErrorResponse {
  error: string;
  type: ErrorType;
  statusCode: number;
  timestamp: string;
}

/**
 * APIエラーを統一処理する関数
 * @param error - 発生したエラー
 * @param fallbackMessage - デフォルトメッセージ
 * @returns エラーメッセージ
 */
export const handleApiError = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof AppError) {
    logger.error('Application Error', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
      stack: error.stack,
    });
    return error.message;
  }

  if (error instanceof Error) {
    logger.error('Unexpected Error', {
      message: error.message,
      stack: error.stack,
    });
    return error.message;
  }

  logger.error('Unknown Error', { error: String(error), fallbackMessage });
  return fallbackMessage;
};

/**
 * Prismaエラーかどうかを判定する
 * @param error - 判定対象のエラー
 * @returns Prismaエラーかどうか
 */
const isPrismaError = (error: unknown): error is PrismaError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    (error as any).code.startsWith('P')
  );
};

/**
 * APIレスポンス用のエラー処理
 * @param error - 発生したエラー
 * @param fallbackMessage - デフォルトメッセージ
 * @returns APIエラーレスポンス
 */
export const createApiErrorResponse = (
  error: unknown,
  fallbackMessage: string = 'Internal server error occurred'
): ApiErrorResponse => {
  if (error instanceof AppError) {
    logger.error('API Error', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
    });

    return {
      error: error.message,
      type: error.type,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  // Prismaエラーの場合、handleDatabaseErrorを使用
  if (isPrismaError(error)) {
    const dbError = handleDatabaseError(error);
    return {
      error: dbError.message,
      type: dbError.type,
      statusCode: dbError.statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof Error) {
    logger.error('Unexpected API Error', {
      message: error.message,
      stack: error.stack,
    });

    return {
      error: error.message,
      type: ErrorType.SERVER_ERROR,
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };
  }

  logger.error('Unknown API Error', { error: String(error) });

  return {
    error: fallbackMessage,
    type: ErrorType.SERVER_ERROR,
    statusCode: 500,
    timestamp: new Date().toISOString(),
  };
};

/**
 * フロントエンド用のエラー処理フック
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

/**
 * データベースエラー専用のハンドラー
 * @param error - Prismaエラー
 * @returns AppError インスタンス
 */
export const handleDatabaseError = (error: PrismaError): AppError => {
  logger.error('Database Error', {
    code: error.code,
    message: error.message,
    meta: JSON.stringify(error.meta),
    clientVersion: error.clientVersion,
  });

  // Prismaエラーコードに基づく処理
  switch (error.code) {
    case 'P2002':
      const duplicateField = error.meta?.target ? ` (${Array.isArray(error.meta.target) ? error.meta.target.join(', ') : error.meta.target})` : '';
      return new AppError(
        `Duplicate data constraint violation${duplicateField}`,
        ErrorType.VALIDATION,
        400
      );
    case 'P2003':
      return new AppError(
        'Related data does not exist',
        ErrorType.VALIDATION,
        400
      );
    case 'P2025':
      return new AppError(
        'Requested data not found',
        ErrorType.NOT_FOUND,
        404
      );
    case 'P2004':
      return new AppError(
        'A constraint failed on the database',
        ErrorType.VALIDATION,
        400
      );
    case 'P2015':
      return new AppError(
        'A related record could not be found',
        ErrorType.NOT_FOUND,
        404
      );
    case 'P2016':
      return new AppError(
        'Query interpretation error',
        ErrorType.VALIDATION,
        400
      );
    case 'P2021':
      return new AppError(
        'The table does not exist in the current database',
        ErrorType.DATABASE_ERROR,
        500
      );
    case 'P2022':
      return new AppError(
        'The column does not exist in the current database',
        ErrorType.DATABASE_ERROR,
        500
      );
    default:
      return new AppError(
        `Database error occurred: ${error.message}`,
        ErrorType.DATABASE_ERROR,
        500
      );
  }
};

/**
 * ネットワークエラーハンドラー
 * @param error - ネットワークエラー
 * @returns AppError インスタンス
 */
export const handleNetworkError = (error: NetworkError): AppError => {
  logger.error('Network Error', {
    name: error.name,
    message: error.message,
  });

  if (error.name === 'NetworkError' || (error.message && error.message.includes('fetch'))) {
    return new AppError(
      'Network connection failed. Please check your internet connection',
      ErrorType.NETWORK_ERROR,
      503
    );
  }

  return new AppError(
    `Communication error occurred: ${error.message}`,
    ErrorType.NETWORK_ERROR,
    503
  );
};
