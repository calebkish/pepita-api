-- AlterTable
ALTER TABLE "Day" ADD COLUMN     "calories" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "carbohydrates" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "fat" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "protein" DECIMAL(65,30) NOT NULL DEFAULT 0;

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
    "foodsOnMeals" TEXT[],
    "recipesOnMeals" TEXT[],
    "accountId" TEXT NOT NULL,

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
