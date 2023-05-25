/*
  Warnings:

  - You are about to drop the column `fdcId` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `gtinUpc` on the `Food` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Food_fdcId_key";

-- AlterTable
ALTER TABLE "Food" DROP COLUMN "fdcId",
DROP COLUMN "gtinUpc",
ADD COLUMN     "sourceImportDate" TIMESTAMP(3),
ADD COLUMN     "sourceUniqueId" TEXT;
