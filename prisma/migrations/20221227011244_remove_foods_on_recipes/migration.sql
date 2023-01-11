/*
  Warnings:

  - You are about to drop the `FoodsOnRecipes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FoodsOnRecipes" DROP CONSTRAINT "FoodsOnRecipes_foodId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnRecipes" DROP CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnRecipes" DROP CONSTRAINT "FoodsOnRecipes_recipeId_fkey";

-- DropTable
DROP TABLE "FoodsOnRecipes";
