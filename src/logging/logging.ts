import fs from 'fs';
import path from 'path';
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

// Define the directory for log files
const logDir = 'logs';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Create a logger instance using Winston
const winstonLogger = winston.createLogger({
    // Set the logging level to 'info'
    level: 'info',
    // Combine timestamp and JSON format for log messages
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    // Define the transports for the logger
    transports: [
        // Output logs to the console
        new winston.transports.Console(),
        // Output logs to a file named 'combined.log'
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
        // Output error logs to a file named 'error.log'
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' })
    ],
});

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

// Create the adapter instance
const logger: ILogger = new WinstonLoggerAdapter(winstonLogger);

// Export the logger instance for use in other parts of the application
export default logger;
