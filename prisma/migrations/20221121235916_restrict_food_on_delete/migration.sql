/*
  Warnings:

  - You are about to drop the column `fdcId` on the `FoodUnit` table. All the data in the column will be lost.
  - You are about to drop the column `fdcId` on the `Unit` table. All the data in the column will be lost.
  - Made the column `foodCategoryId` on table `Food` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unitId` on table `FoodUnit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unitId` on table `NutrientsOnFoods` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Food" DROP CONSTRAINT "Food_foodCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "FoodUnit" DROP CONSTRAINT "FoodUnit_unitId_fkey";

-- DropForeignKey
ALTER TABLE "NutrientsOnFoods" DROP CONSTRAINT "NutrientsOnFoods_nutrientId_fkey";

-- DropForeignKey
ALTER TABLE "NutrientsOnFoods" DROP CONSTRAINT "NutrientsOnFoods_unitId_fkey";

-- DropIndex
DROP INDEX "FoodUnit_fdcId_key";

-- AlterTable
ALTER TABLE "Food" ALTER COLUMN "foodCategoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FoodUnit" DROP COLUMN "fdcId",
ADD COLUMN     "fdcMeasureUnitId" TEXT,
ALTER COLUMN "unitId" SET NOT NULL;

-- AlterTable
ALTER TABLE "NutrientsOnFoods" ALTER COLUMN "unitId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "fdcId",
ADD COLUMN     "fdcMeasureUnitId" TEXT;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_foodCategoryId_fkey" FOREIGN KEY ("foodCategoryId") REFERENCES "FoodCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodUnit" ADD CONSTRAINT "FoodUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
