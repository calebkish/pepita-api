-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TRIAL', 'USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BaseFoodUnit" AS ENUM ('g', 'ml');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "email" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "expirationTimestamp" TIMESTAMP(3),
    "dailyTargetProtein" INTEGER,
    "dailyTargetFat" INTEGER,
    "dailyTargetCarbohydrates" INTEGER,
    "dailyTargetCalories" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "StoreLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDay" TEXT NOT NULL,
    "endDay" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "purchasedFoodsIds" TEXT[],

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodsOnShoppingList" (
    "foodId" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "puchased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FoodsOnShoppingList_pkey" PRIMARY KEY ("foodId","shoppingListId")
);

-- CreateTable
CREATE TABLE "FoodsOnStoreLocations" (
    "foodId" TEXT NOT NULL,
    "storeLocationId" TEXT NOT NULL,

    CONSTRAINT "FoodsOnStoreLocations_pkey" PRIMARY KEY ("foodId","storeLocationId")
);

-- CreateTable
CREATE TABLE "MealTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "carbohydrates" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "inAutoCreatedTemplatesOfAccountId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "MealTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "days" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scale" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "day" TEXT,
    "weight" INTEGER,
    "waist" DECIMAL(65,30),
    "neck" DECIMAL(65,30),
    "calories" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "protein" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "carbohydrates" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fat" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealsOnDays" (
    "mealId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL DEFAULT 1,

    CONSTRAINT "MealsOnDays_pkey" PRIMARY KEY ("mealId","dayId")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "mealTemplateId" TEXT,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipesOnMeals" (
    "recipeId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL DEFAULT 1,

    CONSTRAINT "RecipesOnMeals_pkey" PRIMARY KEY ("recipeId","mealId")
);

-- CreateTable
CREATE TABLE "FoodsOnMeals" (
    "foodId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "scaleBase" INTEGER NOT NULL DEFAULT 1,
    "scaleNumerator" INTEGER NOT NULL DEFAULT 1,
    "scaleDenominator" INTEGER NOT NULL DEFAULT 1,
    "scaleDecimal" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "shouldUseScaleDecimal" BOOLEAN NOT NULL DEFAULT false,
    "halves" BOOLEAN NOT NULL DEFAULT false,
    "thirds" BOOLEAN NOT NULL DEFAULT false,
    "fourths" BOOLEAN NOT NULL DEFAULT false,
    "sixths" BOOLEAN NOT NULL DEFAULT false,
    "eighths" BOOLEAN NOT NULL DEFAULT false,
    "sixteenths" BOOLEAN NOT NULL DEFAULT false,
    "foodUnitId" TEXT NOT NULL,

    CONSTRAINT "FoodsOnMeals_pkey" PRIMARY KEY ("foodId","mealId")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "scale" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "owningBatchRecipeId" TEXT,
    "gramWeight" DECIMAL(65,30),
    "isBatchRecipe" BOOLEAN NOT NULL DEFAULT false,
    "isBatchRecipeEaten" BOOLEAN,
    "directions" TEXT[],
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodsOnRecipes" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "note" TEXT,
    "scaleBase" INTEGER NOT NULL DEFAULT 1,
    "scaleNumerator" INTEGER NOT NULL DEFAULT 1,
    "scaleDenominator" INTEGER NOT NULL DEFAULT 1,
    "scaleDecimal" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "shouldUseScaleDecimal" BOOLEAN NOT NULL DEFAULT false,
    "halves" BOOLEAN NOT NULL DEFAULT false,
    "thirds" BOOLEAN NOT NULL DEFAULT false,
    "fourths" BOOLEAN NOT NULL DEFAULT false,
    "sixths" BOOLEAN NOT NULL DEFAULT false,
    "eighths" BOOLEAN NOT NULL DEFAULT false,
    "sixteenths" BOOLEAN NOT NULL DEFAULT false,
    "foodUnitId" TEXT NOT NULL,

    CONSTRAINT "FoodsOnRecipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FoodBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "baseUnitAmount" DECIMAL(65,30),
    "baseUnit" TEXT,
    "source" TEXT,
    "fdcId" INTEGER,
    "foodBrandId" TEXT,
    "gtinUpc" TEXT,
    "foodCategoryId" TEXT,
    "accountId" TEXT,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodUnit" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "servingSizeAmount" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "halves" BOOLEAN NOT NULL DEFAULT false,
    "thirds" BOOLEAN NOT NULL DEFAULT false,
    "fourths" BOOLEAN NOT NULL DEFAULT false,
    "sixths" BOOLEAN NOT NULL DEFAULT false,
    "eighths" BOOLEAN NOT NULL DEFAULT false,
    "sixteenths" BOOLEAN NOT NULL DEFAULT false,
    "baseUnitAmountRatio" DECIMAL(65,30) NOT NULL,
    "foodUnitAmount" DECIMAL(65,30) NOT NULL,
    "foodId" TEXT NOT NULL,
    "unitId" TEXT,

    CONSTRAINT "FoodUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "halves" BOOLEAN NOT NULL DEFAULT false,
    "thirds" BOOLEAN NOT NULL DEFAULT false,
    "fourths" BOOLEAN NOT NULL DEFAULT false,
    "sixths" BOOLEAN NOT NULL DEFAULT false,
    "eighths" BOOLEAN NOT NULL DEFAULT false,
    "sixteenths" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutrientsOnFoods" (
    "nutrientId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "NutrientsOnFoods_pkey" PRIMARY KEY ("foodId","nutrientId")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fdcNutrientId" INTEGER NOT NULL,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Food_fdcId_key" ON "Food"("fdcId");

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_abbreviation_key" ON "Unit"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategory_name_key" ON "FoodCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Nutrient_name_key" ON "Nutrient"("name");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreLocation" ADD CONSTRAINT "StoreLocation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreLocation" ADD CONSTRAINT "StoreLocation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnShoppingList" ADD CONSTRAINT "FoodsOnShoppingList_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnShoppingList" ADD CONSTRAINT "FoodsOnShoppingList_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnStoreLocations" ADD CONSTRAINT "FoodsOnStoreLocations_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnStoreLocations" ADD CONSTRAINT "FoodsOnStoreLocations_storeLocationId_fkey" FOREIGN KEY ("storeLocationId") REFERENCES "StoreLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealTemplate" ADD CONSTRAINT "MealTemplate_inAutoCreatedTemplatesOfAccountId_fkey" FOREIGN KEY ("inAutoCreatedTemplatesOfAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealTemplate" ADD CONSTRAINT "MealTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealsOnDays" ADD CONSTRAINT "MealsOnDays_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealsOnDays" ADD CONSTRAINT "MealsOnDays_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_mealTemplateId_fkey" FOREIGN KEY ("mealTemplateId") REFERENCES "MealTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnMeals" ADD CONSTRAINT "RecipesOnMeals_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnMeals" ADD CONSTRAINT "RecipesOnMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_owningBatchRecipeId_fkey" FOREIGN KEY ("owningBatchRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_foodBrandId_fkey" FOREIGN KEY ("foodBrandId") REFERENCES "FoodBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_foodCategoryId_fkey" FOREIGN KEY ("foodCategoryId") REFERENCES "FoodCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodUnit" ADD CONSTRAINT "FoodUnit_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodUnit" ADD CONSTRAINT "FoodUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientsOnFoods" ADD CONSTRAINT "NutrientsOnFoods_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
