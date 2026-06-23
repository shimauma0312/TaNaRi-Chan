import { writeLogToDB } from "@/lib/dbLogger"
import { LogLevel, LogSource } from "@prisma/client"
import winston from "winston"

interface LogContext {
  [key: string]: any
}

interface ILogger {
  info(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
}

/**
 * Winston でコンソール出力しつつ `Log` テーブルへ永続化する。
 */
class ServerWinstonLogger implements ILogger {
  private winston: winston.Logger

  constructor() {
    this.winston = winston.createLogger({
      level: process.env.NODE_ENV === "production" ? "warn" : "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [new winston.transports.Console()],
    })
  }

  private persist(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): void {
    writeLogToDB({
      level,
      message,
      context: context as Record<string, unknown> | undefined,
      source: LogSource.SERVER,
    }).catch(() => {
      /* エラーはwriteLogToDB内で処理済み */
    })
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(message, context)
    this.persist(LogLevel.INFO, message, context)
  }

  error(message: string, context?: LogContext): void {
    this.winston.error(message, context)
    this.persist(LogLevel.ERROR, message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, context)
    this.persist(LogLevel.WARN, message, context)
  }

  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, context)
    this.persist(LogLevel.DEBUG, message, context)
  }
}

export default ServerWinstonLogger
