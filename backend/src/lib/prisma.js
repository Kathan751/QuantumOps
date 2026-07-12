import { PrismaClient } from '@prisma/client';

export const prisma = globalThis.assetFlowPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.assetFlowPrisma = prisma;
}
