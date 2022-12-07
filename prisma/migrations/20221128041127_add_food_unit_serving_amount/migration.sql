/*
  Warnings:

  - You are about to drop the column `saved` on the `Food` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Food" DROP COLUMN "saved";

-- AlterTable
ALTER TABLE "FoodUnit" ADD COLUMN     "servingSizeAmount" DECIMAL(65,30) NOT NULL DEFAULT 1;
