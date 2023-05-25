import { PrismaClient, Prisma } from '@prisma/client';

export const prismaClient = new PrismaClient();

await prismaClient.$queryRaw`
  SET pg_trgm.word_similarity_threshold = 0.5;
`;

// A hack to convert `Decimal` to a `number` when serialized.
// @ts-ignore
Prisma.Decimal.prototype.toJSON = function() {
  return this.toNumber();
}
