/*
  Warnings:

  - The primary key for the `FoodsOnRecipes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `FoodsOnRecipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FoodsOnRecipes" DROP CONSTRAINT "FoodsOnRecipes_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "FoodsOnRecipes_pkey" PRIMARY KEY ("foodId", "recipeId");
