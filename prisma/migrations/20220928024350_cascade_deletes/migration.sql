-- DropForeignKey
ALTER TABLE "FoodsOnDays" DROP CONSTRAINT "FoodsOnDays_foodId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnDays" DROP CONSTRAINT "FoodsOnDays_foodUnitId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnMeals" DROP CONSTRAINT "FoodsOnMeals_foodId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnMeals" DROP CONSTRAINT "FoodsOnMeals_foodUnitId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnRecipes" DROP CONSTRAINT "FoodsOnRecipes_foodId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnRecipes" DROP CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey";

-- DropForeignKey
ALTER TABLE "MealsOnDays" DROP CONSTRAINT "MealsOnDays_mealId_fkey";

-- DropForeignKey
ALTER TABLE "RecipesOnDays" DROP CONSTRAINT "RecipesOnDays_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "RecipesOnMeals" DROP CONSTRAINT "RecipesOnMeals_recipeId_fkey";

-- AddForeignKey
ALTER TABLE "FoodsOnDays" ADD CONSTRAINT "FoodsOnDays_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnDays" ADD CONSTRAINT "FoodsOnDays_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnDays" ADD CONSTRAINT "RecipesOnDays_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealsOnDays" ADD CONSTRAINT "MealsOnDays_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnMeals" ADD CONSTRAINT "RecipesOnMeals_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
