import { PrismaClient, Prisma } from '@prisma/client';

export const prismaClient = new PrismaClient();

// A hack to convert `Decimal` to a `number` when serialized.
// @ts-ignore
Prisma.Decimal.prototype.toJSON = function() {
  return this.toNumber();
}
