import winston from 'winston';

interface LogContext {
    [key: string]: any;
}

interface ILogger {
    info(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}

/**
 * サーバーサイド専用Winstonロガー
 * このファイルはサーバーサイドでのみインポートされるべき
 */
class ServerWinstonLogger implements ILogger {
    private winston: winston.Logger;

    constructor() {
        this.winston = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
            ],
        });
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

export default ServerWinstonLogger;