/*
  Warnings:

  - You are about to drop the column `calories` on the `MealTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `carbohydrates` on the `MealTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `fat` on the `MealTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `protein` on the `MealTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MealTemplate" DROP COLUMN "calories",
DROP COLUMN "carbohydrates",
DROP COLUMN "fat",
DROP COLUMN "protein",
ADD COLUMN     "factor" INTEGER NOT NULL DEFAULT 0;
