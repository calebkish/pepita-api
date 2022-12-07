/*
  Warnings:

  - You are about to drop the column `fdcMeasureUnitId` on the `FoodUnit` table. All the data in the column will be lost.
  - You are about to drop the column `modifier` on the `FoodUnit` table. All the data in the column will be lost.
  - You are about to drop the column `stepDenominator` on the `FoodUnit` table. All the data in the column will be lost.
  - You are about to drop the column `stepNumerator` on the `FoodUnit` table. All the data in the column will be lost.
  - You are about to drop the column `unitAbbreviation` on the `NutrientsOnFoods` table. All the data in the column will be lost.
  - You are about to drop the column `fdcMeasureUnitId` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `stepDenominator` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `stepNumerator` on the `Unit` table. All the data in the column will be lost.
  - Added the required column `fdcNutrientId` to the `Nutrient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FoodUnit" DROP COLUMN "fdcMeasureUnitId",
DROP COLUMN "modifier",
DROP COLUMN "stepDenominator",
DROP COLUMN "stepNumerator",
ADD COLUMN     "eighths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fourths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "halves" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sixteenths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sixths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thirds" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "unitId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Nutrient" ADD COLUMN     "fdcNutrientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "NutrientsOnFoods" DROP COLUMN "unitAbbreviation";

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "fdcMeasureUnitId",
DROP COLUMN "stepDenominator",
DROP COLUMN "stepNumerator",
ADD COLUMN     "eighths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fourths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "halves" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sixteenths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sixths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thirds" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "abbreviation" DROP NOT NULL;
