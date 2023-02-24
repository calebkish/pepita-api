/*
  Warnings:

  - You are about to drop the column `scale` on the `FoodsOnMeals` table. All the data in the column will be lost.
  - You are about to drop the column `scale` on the `FoodsOnRecipes` table. All the data in the column will be lost.
  - You are about to drop the `FoodsOnDays` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecipesOnDays` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FoodsOnDays" DROP CONSTRAINT "FoodsOnDays_dayId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnDays" DROP CONSTRAINT "FoodsOnDays_foodId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnDays" DROP CONSTRAINT "FoodsOnDays_foodUnitId_fkey";

-- DropForeignKey
ALTER TABLE "RecipesOnDays" DROP CONSTRAINT "RecipesOnDays_dayId_fkey";

-- DropForeignKey
ALTER TABLE "RecipesOnDays" DROP CONSTRAINT "RecipesOnDays_recipeId_fkey";

-- AlterTable
ALTER TABLE "FoodsOnMeals" DROP COLUMN "scale",
ADD COLUMN     "eighths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fourths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "halves" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scaleBase" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scaleDecimal" DECIMAL(65,30) NOT NULL DEFAULT 1,
ADD COLUMN     "scaleDenominator" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scaleNumerator" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shouldUseScaleDecimal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sixteenths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sixths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thirds" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FoodsOnRecipes" DROP COLUMN "scale",
ADD COLUMN     "eighths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fourths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "halves" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scaleBase" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scaleDecimal" DECIMAL(65,30) NOT NULL DEFAULT 1,
ADD COLUMN     "scaleDenominator" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scaleNumerator" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shouldUseScaleDecimal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sixteenths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sixths" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thirds" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "FoodsOnDays";

-- DropTable
DROP TABLE "RecipesOnDays";
