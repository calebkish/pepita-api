import { Prisma } from "@prisma/client";
import { duplicateFoodUnits } from "./duplicate-food-unit.js";

export async function duplicateFood(tx: Prisma.TransactionClient, foodId: string) {
    const food = await tx.food.findUnique({
      where: { id: foodId },
      include: { foodUnits: true },
    });

    if (food === null) {
      return null;
    }

    const dupFood = await tx.meal.create({
      data: {
        name: food.name,
        protein: food.protein,
        carbohydrates: food.carbohydrates,
        fat: food.fat,
        calories: food.calories,
        accountId: food.accountId,
        gramWeight: food.gramWeight,
        duplicatedFrom: food.id,
      },
    });

    const foodUnitMap = await duplicateFoodUnits(tx, food.foodUnits, dupFood.id);

    return {
      duplicateFoodId: dupFood.id,
      foodUnitMap
    };
}
