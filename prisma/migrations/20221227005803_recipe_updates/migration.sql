/*
  Warnings:

  - Made the column `foodUnitId` on table `FoodsOnDays` required. This step will fail if there are existing NULL values in that column.
  - Made the column `foodUnitId` on table `FoodsOnRecipes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "FoodsOnDays" DROP CONSTRAINT "FoodsOnDays_foodUnitId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnRecipes" DROP CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey";

-- AlterTable
ALTER TABLE "FoodsOnDays" ALTER COLUMN "foodUnitId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FoodsOnRecipes" ALTER COLUMN "foodUnitId" SET NOT NULL,
ALTER COLUMN "note" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "FoodsOnDays" ADD CONSTRAINT "FoodsOnDays_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
