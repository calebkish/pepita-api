-- CreateTable
CREATE TABLE "FoodsOnRecipes" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "note" TEXT,
    "foodUnitId" TEXT NOT NULL,

    CONSTRAINT "FoodsOnRecipes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
