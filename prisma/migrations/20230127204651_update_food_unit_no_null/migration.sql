/*
  Warnings:

  - Made the column `foodUnitId` on table `FoodsOnMeals` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FoodsOnMeals" ALTER COLUMN "foodUnitId" SET NOT NULL;
