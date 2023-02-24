/*
  Warnings:

  - You are about to drop the column `usdaDataType` on the `Food` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Food" DROP COLUMN "usdaDataType",
ADD COLUMN     "foodBrand" TEXT;
