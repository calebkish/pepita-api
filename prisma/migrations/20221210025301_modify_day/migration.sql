/*
  Warnings:

  - You are about to drop the column `calories` on the `Day` table. All the data in the column will be lost.
  - You are about to drop the column `batchRecipeId` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the `BatchRecipe` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gramWeight` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BatchRecipe" DROP CONSTRAINT "BatchRecipe_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_batchRecipeId_fkey";

-- AlterTable
ALTER TABLE "Day" DROP COLUMN "calories",
ALTER COLUMN "day" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "batchRecipeId",
ADD COLUMN     "gramWeight" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "isBatchRecipe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBatchRecipeCooked" BOOLEAN,
ADD COLUMN     "isBatchRecipeEaten" BOOLEAN,
ADD COLUMN     "owningBatchRecipeId" TEXT;

-- DropTable
DROP TABLE "BatchRecipe";

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_owningBatchRecipeId_fkey" FOREIGN KEY ("owningBatchRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
