/*
  Warnings:

  - Added the required column `gramWeight` to the `FoodUnit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FoodUnit" ADD COLUMN     "gramWeight" DECIMAL(65,30) NOT NULL;
