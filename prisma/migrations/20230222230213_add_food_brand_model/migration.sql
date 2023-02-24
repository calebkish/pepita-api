/*
  Warnings:

  - You are about to drop the column `foodBrand` on the `Food` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Food" DROP COLUMN "foodBrand",
ADD COLUMN     "foodBrandId" TEXT;

-- CreateTable
CREATE TABLE "FoodBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FoodBrand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodBrand_name_key" ON "FoodBrand"("name");

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_foodBrandId_fkey" FOREIGN KEY ("foodBrandId") REFERENCES "FoodBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
