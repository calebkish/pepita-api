/*
  Warnings:

  - Added the required column `calories` to the `MealTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MealTemplate" ADD COLUMN     "calories" INTEGER NOT NULL;
