import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function positiveDays(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  return value
}

async function main() {
  const now = new Date()
  const logCutoff = new Date(now.getTime() - positiveDays("LOG_RETENTION_DAYS", 30) * 86_400_000)
  const revokedSessionCutoff = new Date(
    now.getTime() - positiveDays("REVOKED_SESSION_RETENTION_DAYS", 7) * 86_400_000,
  )

  const [logs, sessions, rateLimits] = await prisma.$transaction([
    prisma.log.deleteMany({ where: { createdAt: { lt: logCutoff } } }),
    prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: revokedSessionCutoff } }],
      },
    }),
    prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }),
  ])

  console.log(
    JSON.stringify({
      deletedLogs: logs.count,
      deletedSessions: sessions.count,
      deletedRateLimits: rateLimits.count,
    }),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
