/**
 * ロギングユーティリティ
 * 
 * - サーバーサイド: winston ライブラリによるファイル出力
 * - クライアントサイド: console API によるフォールバック
 * 
 * @example
 * import logger from '@/utils/logger';
 * 
 * logger.info('処理開始');
 * logger.error('エラーが発生しました');
 * logger.warn('警告メッセージ');
 * logger.debug('デバッグ情報');
 * 
 * // コンテキスト情報付きログ
 * logger.info('ユーザーログイン', { userId: '12345' });
 */

/**
 * ログコンテキスト情報の型定義
 */
interface LogContext {
  [key: string]: any;
}

/**
 * クライアントサイドで使うコンソールベースロガー
 * 
 * - ブラウザ環境向けの Console API ラッパー
 * 
 * @example
 * const logger = new ClientLogger();
 * logger.info('情報ログ');
 * logger.error('エラーログ');
 * logger.warn('警告ログ');
 * logger.debug('デバッグログ');
 */
class ClientLogger {
  /**
   * 情報レベルログ出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報
   */
  info(message: string, context?: LogContext) {
    if (typeof window !== 'undefined') {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * エラーレベルログ出力
   * @param message エラーメッセージ
   * @param context エラー詳細情報
   */
  error(message: string, context?: LogContext) {
    if (typeof window !== 'undefined') {
      console.error(`[ERROR] ${message}`, context || '');
    }
  }

  /**
   * 警告レベルログ出力
   * @param message 警告メッセージ
   * @param context 警告関連情報
   */
  warn(message: string, context?: LogContext) {
    if (typeof window !== 'undefined') {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  /**
   * デバッグレベルログ出力
   * @param message デバッグメッセージ
   * @param context デバッグ情報
   */
  debug(message: string, context?: LogContext) {
    if (typeof window !== 'undefined') {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }
}

/**
 * ロガーインスタンス変数
 * 
 * 概要
 * - 実行環境に応じて格納するロガーインスタンスをかえる
 * - サーバーサイド: winston ベース
 * - クライアントサイド: console ベース
 * 
 * 型定義
 * - any 型を使用（winston と ClientLogger の統一のため）
 * - 実際の使用時は適切なログメソッドが利用可能
 * 
 * @type {any}
 */
let logger: any;

/**
 * 環境別ロガーインスタンス初期化処理
 * 
 */
if (typeof window === 'undefined') {
  // サーバーサイド環境: winston ロガー使用を試行
  try {
    logger = require('@/logging/logging').default;
  } catch (error) {
    // winston が利用できない場合はクライアントロガーにフォールバック
    logger = new ClientLogger();
  }
} else {
  // クライアントサイド環境: console ベースのロガー使用
  logger = new ClientLogger();
}

/**
 * 統一ロガーインスタンス
 * 
 * ```typescript
 * import logger from '@/utils/logger';
 * 
 * // 各ログレベルでの出力
 * logger.info('情報ログ');
 * logger.error('エラーログ');
 * logger.warn('警告ログ');
 * logger.debug('デバッグログ');
 * 
 * // コンテキスト付きログ
 * logger.info('処理完了', { duration: 100, status: 'success' });
 * ```
 * 
 * - 環境で自動的にロガーを切り替える
 * 
 * @exports logger
 * @default logger
 */
export default logger;
