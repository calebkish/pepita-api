/*
  Warnings:

  - You are about to drop the column `gramWeight` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `gramWeight` on the `FoodUnit` table. All the data in the column will be lost.
  - You are about to drop the column `unitToGramRatio` on the `FoodUnit` table. All the data in the column will be lost.
  - Added the required column `baseUnitAmountRatio` to the `FoodUnit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foodUnitAmount` to the `FoodUnit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BaseFoodUnit" AS ENUM ('g', 'ml');

-- AlterTable
ALTER TABLE "Food" DROP COLUMN "gramWeight",
ADD COLUMN     "baseUnit" TEXT,
ADD COLUMN     "baseUnitAmount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "FoodUnit" DROP COLUMN "gramWeight",
DROP COLUMN "unitToGramRatio",
ADD COLUMN     "baseUnitAmountRatio" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "foodUnitAmount" DECIMAL(65,30) NOT NULL;
