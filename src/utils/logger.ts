/** ログコンテキスト情報 */
export interface LogContext {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | Record<string, unknown>
}

/** ロガーインターフェース */
export interface ILogger {
  info(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
}

// ─────────────────────────────────────────────────────────────────
// クライアントサイドロガー
// console に出力しつつ POST /api/logs でサーバーへ送信する
// ─────────────────────────────────────────────────────────────────
class ClientLogger implements ILogger {
  private send(level: string, message: string, context?: LogContext): void {
    // fire-and-forget
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        message,
        context: context ?? null,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      }),
    }).catch(() => {
      // ネットワークエラーは無視（ログ送信の失敗でアプリを止めない）
    })
  }

  info(message: string, context?: LogContext): void {
    console.log(`[INFO] ${message}`, context ?? "")
    this.send("INFO", message, context)
  }

  error(message: string, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, context ?? "")
    this.send("ERROR", message, context)
  }

  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context ?? "")
    this.send("WARN", message, context)
  }

  debug(message: string, context?: LogContext): void {
    console.debug(`[DEBUG] ${message}`, context ?? "")
    this.send("DEBUG", message, context)
  }
}

// ─────────────────────────────────────────────────────────────────
// 環境別ロガーインスタンスの初期化
// サーバー: Winston + DB (logging/serverLogger)
// クライアント: console + /api/logs
// ─────────────────────────────────────────────────────────────────
let logger: ILogger

if (typeof window === "undefined") {
  // サーバーサイド: DB 書き込み対応の winston ロガーを使用
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ServerWinstonLogger = require("@/logging/serverLogger").default
    logger = new ServerWinstonLogger()
  } catch {
    // フォールバック: console のみ
    logger = new ClientLogger()
  }
} else {
  // クライアントサイド: API 経由で DB に送信
  logger = new ClientLogger()
}

export default logger
