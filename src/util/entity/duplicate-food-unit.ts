import { FoodUnit, Prisma } from '@prisma/client';

export async function duplicateFoodUnits(tx: Prisma.TransactionClient, foodUnits: FoodUnit[], dupFoodId: string): Promise<Map<string, string>> {
  const foodUnitMap = new Map<string, string>();

  for (const foodUnit of foodUnits) {
    const dupFoodUnit = await tx.foodUnit.create({
      data: {
        unitToGramRatio: foodUnit.unitToGramRatio,
        name: foodUnit.name,
        abbreviation: foodUnit.abbreviation,
        stepNumerator: foodUnit.stepNumerator,
        stepDenominator: foodUnit.stepDenominator,
        foodId: dupFoodId,
      },
    });
    foodUnitMap.set(foodUnit.id, dupFoodUnit.id);
  }

  return foodUnitMap;
}

