-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodsOnDays" (
    "foodId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL,
    "foodUnitId" TEXT,

    CONSTRAINT "FoodsOnDays_pkey" PRIMARY KEY ("foodId","dayId")
);

-- CreateTable
CREATE TABLE "RecipesOnDays" (
    "recipeId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "RecipesOnDays_pkey" PRIMARY KEY ("recipeId","dayId")
);

-- CreateTable
CREATE TABLE "MealsOnDays" (
    "mealId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "MealsOnDays_pkey" PRIMARY KEY ("mealId","dayId")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipesOnMeals" (
    "recipeId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "RecipesOnMeals_pkey" PRIMARY KEY ("recipeId","mealId")
);

-- CreateTable
CREATE TABLE "FoodsOnMeals" (
    "foodId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL,
    "foodUnitId" TEXT,

    CONSTRAINT "FoodsOnMeals_pkey" PRIMARY KEY ("foodId","mealId")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "duplicatedFrom" TEXT,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodsOnRecipes" (
    "foodId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "scale" DECIMAL(65,30) NOT NULL,
    "foodUnitId" TEXT,

    CONSTRAINT "FoodsOnRecipes_pkey" PRIMARY KEY ("foodId","recipeId")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "duplicatedFrom" TEXT,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "gramWeight" DECIMAL(65,30),
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "carbohydrates" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "duplicatedFrom" TEXT,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "stepNumerator" INTEGER NOT NULL,
    "stepDenominator" INTEGER NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodUnit" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unitToGramRatio" DECIMAL(65,30) NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "stepNumerator" INTEGER NOT NULL,
    "stepDenominator" INTEGER NOT NULL,
    "foodId" TEXT NOT NULL,

    CONSTRAINT "FoodUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_abbreviation_key" ON "Unit"("abbreviation");

-- AddForeignKey
ALTER TABLE "FoodsOnDays" ADD CONSTRAINT "FoodsOnDays_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnDays" ADD CONSTRAINT "FoodsOnDays_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnDays" ADD CONSTRAINT "FoodsOnDays_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnDays" ADD CONSTRAINT "RecipesOnDays_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnDays" ADD CONSTRAINT "RecipesOnDays_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealsOnDays" ADD CONSTRAINT "MealsOnDays_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealsOnDays" ADD CONSTRAINT "MealsOnDays_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnMeals" ADD CONSTRAINT "RecipesOnMeals_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesOnMeals" ADD CONSTRAINT "RecipesOnMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnMeals" ADD CONSTRAINT "FoodsOnMeals_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_duplicatedFrom_fkey" FOREIGN KEY ("duplicatedFrom") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnRecipes" ADD CONSTRAINT "FoodsOnRecipes_foodUnitId_fkey" FOREIGN KEY ("foodUnitId") REFERENCES "FoodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_duplicatedFrom_fkey" FOREIGN KEY ("duplicatedFrom") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_duplicatedFrom_fkey" FOREIGN KEY ("duplicatedFrom") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodUnit" ADD CONSTRAINT "FoodUnit_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
