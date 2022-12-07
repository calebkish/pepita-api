/*
  Warnings:

  - You are about to drop the column `calories` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `carbohydrates` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `duplicatedFrom` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `fat` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `protein` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `duplicatedFrom` on the `Meal` table. All the data in the column will be lost.
  - You are about to drop the column `duplicatedFrom` on the `Recipe` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fdcId]` on the table `Food` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `FoodUnit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[abbreviation]` on the table `FoodUnit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fdcId]` on the table `FoodUnit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fdcId` to the `FoodUnit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fdcId` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Food" DROP CONSTRAINT "Food_duplicatedFrom_fkey";

-- DropForeignKey
ALTER TABLE "Meal" DROP CONSTRAINT "Meal_duplicatedFrom_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_duplicatedFrom_fkey";

-- AlterTable
ALTER TABLE "Day" ALTER COLUMN "day" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Food" DROP COLUMN "calories",
DROP COLUMN "carbohydrates",
DROP COLUMN "duplicatedFrom",
DROP COLUMN "fat",
DROP COLUMN "protein",
ADD COLUMN     "fdcId" INTEGER,
ADD COLUMN     "foodCategoryId" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "usdaDataType" TEXT;

-- AlterTable
ALTER TABLE "FoodUnit" ADD COLUMN     "fdcId" TEXT NOT NULL,
ADD COLUMN     "modifier" TEXT,
ADD COLUMN     "unitId" TEXT,
ALTER COLUMN "abbreviation" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FoodsOnDays" ALTER COLUMN "scale" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "FoodsOnMeals" ALTER COLUMN "scale" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "FoodsOnRecipes" ALTER COLUMN "scale" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Meal" DROP COLUMN "duplicatedFrom";

-- AlterTable
ALTER TABLE "MealsOnDays" ALTER COLUMN "scale" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "duplicatedFrom",
ADD COLUMN     "directions" TEXT[];

-- AlterTable
ALTER TABLE "RecipesOnDays" ALTER COLUMN "scale" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "RecipesOnMeals" ALTER COLUMN "scale" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "fdcId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "days" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scale" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodNutrient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "unitId" TEXT,
    "unitAbbreviation" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,

    CONSTRAINT "FoodNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategory_name_key" ON "FoodCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FoodNutrient_name_key" ON "FoodNutrient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Food_fdcId_key" ON "Food"("fdcId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodUnit_name_key" ON "FoodUnit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FoodUnit_abbreviation_key" ON "FoodUnit"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "FoodUnit_fdcId_key" ON "FoodUnit"("fdcId");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_foodCategoryId_fkey" FOREIGN KEY ("foodCategoryId") REFERENCES "FoodCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodUnit" ADD CONSTRAINT "FoodUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodNutrient" ADD CONSTRAINT "FoodNutrient_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodNutrient" ADD CONSTRAINT "FoodNutrient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
