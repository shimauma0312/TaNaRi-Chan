import winston from 'winston';

interface LogContext {
    [key: string]: any;
}

/**
 * 統一ロガーインターフェース
 * winston,ClientLogger共通メソッド
 */
interface ILogger {
    info(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}

// サーバーサイドかどうかをチェック
const isServer = typeof window === 'undefined';

/**
 * クライアントサイドロガー
 */
class ClientLogger implements ILogger {
    info(message: string, context?: LogContext): void {
        console.info(message, context);
    }

    error(message: string, context?: LogContext): void {
        console.error(message, context);
    }

    warn(message: string, context?: LogContext): void {
        console.warn(message, context);
    }

    debug(message: string, context?: LogContext): void {
        console.debug(message, context);
    }
}

/**
 * Winston ロガーのラッパークラス
 */
class WinstonLoggerAdapter implements ILogger {
    private winston: winston.Logger;

    constructor(winstonInstance: winston.Logger) {
        this.winston = winstonInstance;
    }

    info(message: string, context?: LogContext): void {
        this.winston.info(message, context);
    }

    error(message: string, context?: LogContext): void {
        this.winston.error(message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.winston.warn(message, context);
    }

    debug(message: string, context?: LogContext): void {
        this.winston.debug(message, context);
    }
}

// ロガーインスタンスを作成
let logger: ILogger;

if (isServer) {
    // サーバーサイドではWinstonを使用
    const winstonLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.Console(),
        ],
    });
    logger = new WinstonLoggerAdapter(winstonLogger);
} else {
    // クライアントサイドでは console を使用
    logger = new ClientLogger();
}

// Export the logger instance for use in other parts of the application
export default logger;
