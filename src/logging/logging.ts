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
 * サーバーサイドロガー（遅延ロード）
 */
class ServerLogger implements ILogger {
    private serverLoggerInstance: any = null;
    private initPromise: Promise<any> | null = null;
    private fallbackLogger = new ClientLogger();

    private async initServerLogger() {
        if (!this.initPromise) {
            this.initPromise = (async () => {
                try {
                    // 厳密にサーバーサイドでのみロード
                    if (typeof window !== 'undefined') {
                        throw new Error('Server logger should not be loaded on client side');
                    }
                    
                    const { default: ServerWinstonLogger } = await import('./serverLogger');
                    this.serverLoggerInstance = new ServerWinstonLogger();
                    return this.serverLoggerInstance;
                } catch (error) {
                    console.warn('Winston logger not available, using console fallback:', error);
                    this.serverLoggerInstance = this.fallbackLogger;
                    return this.serverLoggerInstance;
                }
            })();
        }
        await this.initPromise;
        return this.serverLoggerInstance || this.fallbackLogger;
    }

    info(message: string, context?: LogContext): void {
        if (this.serverLoggerInstance) {
            this.serverLoggerInstance.info(message, context);
        } else {
            this.initServerLogger().then(logger => logger.info(message, context)).catch(() => {
                this.fallbackLogger.info(message, context);
            });
        }
    }

    error(message: string, context?: LogContext): void {
        if (this.serverLoggerInstance) {
            this.serverLoggerInstance.error(message, context);
        } else {
            this.initServerLogger().then(logger => logger.error(message, context)).catch(() => {
                this.fallbackLogger.error(message, context);
            });
        }
    }

    warn(message: string, context?: LogContext): void {
        if (this.serverLoggerInstance) {
            this.serverLoggerInstance.warn(message, context);
        } else {
            this.initServerLogger().then(logger => logger.warn(message, context)).catch(() => {
                this.fallbackLogger.warn(message, context);
            });
        }
    }

    debug(message: string, context?: LogContext): void {
        if (this.serverLoggerInstance) {
            this.serverLoggerInstance.debug(message, context);
        } else {
            this.initServerLogger().then(logger => logger.debug(message, context)).catch(() => {
                this.fallbackLogger.debug(message, context);
            });
        }
    }
}

// ロガーインスタンスを作成
const logger: ILogger = isServer ? new ServerLogger() : new ClientLogger();

// Export the logger instance for use in other parts of the application
export default logger;
