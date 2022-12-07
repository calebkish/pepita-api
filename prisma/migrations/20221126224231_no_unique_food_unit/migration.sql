-- DropForeignKey
ALTER TABLE "FoodUnit" DROP CONSTRAINT "FoodUnit_unitId_fkey";

-- DropIndex
DROP INDEX "FoodUnit_abbreviation_key";

-- DropIndex
DROP INDEX "FoodUnit_name_key";

-- AddForeignKey
ALTER TABLE "FoodUnit" ADD CONSTRAINT "FoodUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
