/*
  Warnings:

  - Added the required column `indexedName` to the `Food` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Food_name_idx";

-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "indexedName" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Food_indexedName_idx" ON "Food" USING GIN ("indexedName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Recipe_name_idx" ON "Recipe" USING GIN ("name" gin_trgm_ops);
