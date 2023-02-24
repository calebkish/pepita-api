import { Food, Meal, FoodsOnMeals, FoodUnit, Prisma } from "@prisma/client";
import { prismaClient } from "../db.js";

export async function upsertFoodOnMeal(
  body: {
    foodId: Food['id'],
    mealId: Meal['id'],
    foodUnitId: FoodUnit['id']
    scaleDecimal: FoodsOnMeals['scaleDecimal'],
    scaleNumerator: FoodsOnMeals['scaleNumerator'],
    scaleDenominator: FoodsOnMeals['scaleDenominator'],
    scaleBase: FoodsOnMeals['scaleBase'],
    halves: FoodsOnMeals['halves'],
    thirds: FoodsOnMeals['thirds'],
    fourths: FoodsOnMeals['fourths'],
    sixths: FoodsOnMeals['sixths'],
    eighths: FoodsOnMeals['eighths'],
    sixteenths: FoodsOnMeals['sixteenths'],
    shouldUseScaleDecimal: FoodsOnMeals['shouldUseScaleDecimal'],
  },
  tx?: Prisma.TransactionClient,
): Promise<FoodsOnMeals & { food: Food }> {
  const client = tx ? tx : prismaClient;

  const {
    foodId, mealId, foodUnitId, scaleDecimal, scaleDenominator,
    scaleNumerator, scaleBase, shouldUseScaleDecimal, halves, thirds, fourths,
    sixths, sixteenths
  } = body;

  const foodOnMeal = await client.foodsOnMeals.upsert({
    where: {
      foodId_mealId: {
        foodId,
        mealId,
      }
    },
    create: {
      scaleDecimal,
      scaleDenominator,
      scaleNumerator,
      scaleBase,
      shouldUseScaleDecimal,
      halves,
      thirds,
      fourths,
      sixths,
      sixteenths,

      foodId,
      mealId,
      foodUnitId,
    },
    update: {
      scaleDecimal,
      scaleDenominator,
      scaleNumerator,
      scaleBase,
      shouldUseScaleDecimal,
      halves,
      thirds,
      fourths,
      sixths,
      sixteenths,

      foodUnitId,
    },
    include: {
      food: true,
    }
  });

  return foodOnMeal;
}
