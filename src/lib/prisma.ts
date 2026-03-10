import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient シングルトン
 *
 * Next.js の Hot-Reload で複数インスタンスが作られないよう
 * グローバル変数にキャッシュする。
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
