import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var orbitPayPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.orbitPayPrisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.orbitPayPrisma = prisma;
}
