/**
 * DBロガーサービス
 *
 * `Log` テーブルにログを永続化する。
 * 書き込み失敗時はコンソールへのフォールバックのみを行う。
 */
import { LogLevel, LogSource, Prisma } from "@prisma/client"
import prisma from "./prisma"

export type { LogLevel, LogSource }

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  source?: LogSource
  userId?: string
  path?: string
}

/**
 * ログを DB に書き込む
 * @param entry ログエントリ
 */
export async function writeLogToDB(entry: LogEntry): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        level: entry.level,
        message: entry.message,
        context: entry.context
          ? (entry.context as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        source: entry.source ?? LogSource.SERVER,
        userId: entry.userId ?? null,
        path: entry.path ?? null,
      },
    })
  } catch (err) {
    console.error("[dbLogger] DB へのログ書き込みに失敗しました:", err)
  }
}
