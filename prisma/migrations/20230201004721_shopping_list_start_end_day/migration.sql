/*
  Warnings:

  - You are about to drop the column `foodsOnMeals` on the `ShoppingList` table. All the data in the column will be lost.
  - You are about to drop the column `recipesOnMeals` on the `ShoppingList` table. All the data in the column will be lost.
  - Added the required column `endDay` to the `ShoppingList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDay` to the `ShoppingList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ShoppingList" DROP COLUMN "foodsOnMeals",
DROP COLUMN "recipesOnMeals",
ADD COLUMN     "endDay" TEXT NOT NULL,
ADD COLUMN     "startDay" TEXT NOT NULL;
