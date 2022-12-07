/*
  Warnings:

  - You are about to drop the `FoodNutrient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FoodNutrient" DROP CONSTRAINT "FoodNutrient_foodId_fkey";

-- DropForeignKey
ALTER TABLE "FoodNutrient" DROP CONSTRAINT "FoodNutrient_unitId_fkey";

-- DropTable
DROP TABLE "FoodNutrient";

-- CreateTable
CREATE TABLE "NutrientsOnFoods" (
    "nutrientId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "unitId" TEXT,
    "unitAbbreviation" TEXT NOT NULL,

    CONSTRAINT "NutrientsOnFoods_pkey" PRIMARY KEY ("foodId","nutrientId")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nutrient_name_key" ON "Nutrient"("name");

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
