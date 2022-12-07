/*
  Warnings:

  - Added the required column `note` to the `FoodsOnRecipes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "DecimaedailyTargetProtein" INTEGER,
ADD COLUMN     "dailyTargetCalories" INTEGER,
ADD COLUMN     "dailyTargetCarbohydrates" INTEGER,
ADD COLUMN     "dailyTargetFat" INTEGER;

-- AlterTable
ALTER TABLE "Day" ADD COLUMN     "calories" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "neck" DECIMAL(65,30),
ADD COLUMN     "waist" DECIMAL(65,30),
ADD COLUMN     "weight" INTEGER;

-- AlterTable
ALTER TABLE "FoodsOnRecipes" ADD COLUMN     "note" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "mealTemplateId" TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "batchRecipeId" TEXT;

-- CreateTable
CREATE TABLE "MealTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "carbohydrates" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "inAutoCreatedTemplatesOfAccountId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "MealTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchRecipe" (
    "id" TEXT NOT NULL,
    "gramWeight" DECIMAL(65,30) NOT NULL,
    "isCooked" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "BatchRecipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MealTemplate" ADD CONSTRAINT "MealTemplate_inAutoCreatedTemplatesOfAccountId_fkey" FOREIGN KEY ("inAutoCreatedTemplatesOfAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealTemplate" ADD CONSTRAINT "MealTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchRecipe" ADD CONSTRAINT "BatchRecipe_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_mealTemplateId_fkey" FOREIGN KEY ("mealTemplateId") REFERENCES "MealTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_batchRecipeId_fkey" FOREIGN KEY ("batchRecipeId") REFERENCES "BatchRecipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
