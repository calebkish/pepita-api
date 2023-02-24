import { Food, FoodUnit, Prisma, Recipe } from '@prisma/client';
import express from 'express';
import { body, param } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { notEmpty } from '../validators/not-empty.js';

const shoppingListRouter = express.Router();

// Get all shopping lists
shoppingListRouter.get(
  '/',
  isAuthorized,
  async(req, res) => {
    const { accountId } = res.locals;

    const stores = await prismaClient.shoppingList.findMany({
      where: { accountId },
      orderBy: {
        startDay: Prisma.SortOrder.desc,
      }
    });

    return res.status(200).send(stores);
  },
);

// Get a shopping list
shoppingListRouter.get(
  '/:id',
  isAuthorized,
  param('id').custom(notEmpty),
  isValid,
  async(req, res, next) => {
    const { accountId } = res.locals;
    const { id } = req.params;

    const shoppingList = await prismaClient.shoppingList.findUnique({
      where: { id },
    });

    if (shoppingList === null) {
      res.sendStatus(404);
      next();
      return;
    }

    const startDate = isoToUtcDate(shoppingList.startDay);
    const endDate = isoToUtcDate(shoppingList.endDay);
    const dateRange = getDateRange(startDate, endDate);
    const dateRangeStrings = dateRange.map(date => utcDateToIso(date));

    const days = await prismaClient.day.findMany({
      where: {
        day: {
          in: dateRangeStrings,
        },
      },
      include: {
        mealsOnDays: {
          include: {
            meal: {
              include: {
                foodsOnMeals: {
                  include: {
                    food: true,
                    foodUnit: true,
                  },
                },
                recipesOnMeals: {
                  include: {
                    recipe: {
                      include: {
                        foodsOnRecipes: {
                          include: {
                            food: true,
                            foodUnit: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });


    const mappedFoodsOnDays: FoodListItem[] = days.map(day => {
      return day.mealsOnDays.map(mealsOnDays => {

        const mappedFoodsOnMeals: FoodListItem[] = mealsOnDays.meal.foodsOnMeals.map(foodsOnMeals => {
          const { scaleBase, scaleNumerator, scaleDenominator, scaleDecimal,
            shouldUseScaleDecimal, food, foodUnit } = foodsOnMeals;
          const foodOnMealScale = shouldUseScaleDecimal ? Number(scaleDecimal) : scaleBase + scaleNumerator / scaleDenominator;
          return {
            amount: Number(foodUnit.servingSizeAmount) * foodOnMealScale,
            grams: Number(foodUnit.foodUnitAmount) * foodOnMealScale,
            food: {
              id: food.id,
              name: food.name,
            },
            foodUnit: {
              id: foodUnit.id,
              name: foodUnit.name,
            },
          };
        });

        const mappedFoodsOnRecipesOnMeals: FoodListItem[] = mealsOnDays.meal.recipesOnMeals.map(recipeOnMeal => {
          const mappedFoodsOnRecipes: FoodListItem[] = recipeOnMeal.recipe.foodsOnRecipes.map(foodOnRecipe => {
            const { scaleBase, scaleNumerator, scaleDenominator, scaleDecimal,
              shouldUseScaleDecimal, food, foodUnit } = foodOnRecipe;
            const foodOnRecipeScale = shouldUseScaleDecimal ? Number(scaleDecimal) : scaleBase + scaleNumerator / scaleDenominator;
            return {
              amount: Number(foodUnit.servingSizeAmount) * foodOnRecipeScale * Number(recipeOnMeal.scale),
              grams: Number(foodUnit.foodUnitAmount) * foodOnRecipeScale * Number(recipeOnMeal.scale),
              food: {
                id: food.id,
                name: food.name,
              },
              foodUnit: {
                id: foodUnit.id,
                name: foodUnit.name,
              },
              associatedRecipe: {
                id: recipeOnMeal.recipe.id,
                name: recipeOnMeal.recipe.name,
              },
            };
          });
          return mappedFoodsOnRecipes;
        }).flat();

        return [
          ...mappedFoodsOnMeals,
          ...mappedFoodsOnRecipesOnMeals,
        ];

      }).flat();
    }).flat();


    const itemsGroupedByFoods = groupBy(mappedFoodsOnDays, item => item.food.name);

    const itemsGroupedByFoodsReducedByUnits = Object.fromEntries(Object.entries(itemsGroupedByFoods).map(([foodId, foodGroup]) => {

      const reducedByUnit = Object.entries(groupBy(foodGroup, foodListItem => foodListItem.foodUnit.name)).map(([_, unitGroup]) => {
        const first = unitGroup[0];
        const reduced = unitGroup.reduce((prev, curr) => {
          return {
            ...prev,
            amount: prev.amount + curr.amount,
            grams: prev.grams + curr.grams,
          };
        }, { amount: 0, grams: 0, food: first.food, foodUnit: first.foodUnit });
        return reduced;
      });

      return [foodId, reducedByUnit];
    }));

    res.status(200).send({
      shoppingList,
      itemsGroupedByFoods,
      itemsGroupedByFoodsReducedByUnits,
    });
    next();
    return;
  },
);

function groupBy<T>(arr: T[], keySelector: (val: T) => string): Record<string, T[]> {
  let groups: Record<string, T[]> = {};
  for (const item of arr) {
    const key = keySelector(item);
    const oldGroup = groups[key] ?? [];
    groups = {
      ...groups,
      [key]: [...oldGroup, item],
    };
  }
  return groups;
}

type FoodListItem = {
  amount: number;
  grams: number;
  food: {
    id: Food['id'];
    name: Food['name'];
  },
  foodUnit: {
    id: FoodUnit['id'];
    name: FoodUnit['name'];
  },
  associatedRecipe?: {
    id: Recipe['id'];
    name: Recipe['name'];
  }
};

const getDateRange = (start: Date, end: Date) => {
  for(var arr=[], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate()+1)) {
      arr.push(new Date(dt));
  }
  return arr;
};

const isoToUtcDate = (iso: string): Date => {
  const [year, month, day] = iso.split('-');

  if (
    !year ||
    Number.isNaN(Number(year)) ||
    !month ||
    Number.isNaN(Number(month)) ||
    !day ||
    Number.isNaN(Number(day))
  ) {
    throw new Error('Failed to convert ISO timestamp to day');
  }

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
};

const utcDateToIso = (date: Date): string => {
  return date.toISOString().split('T')[0];
}



/// Upsert a shopping list
shoppingListRouter.put(
  '/',
  isAuthorized,
  body('startDay').isDate(),
  body('endDay').isDate(),
  body('purchasedFoodsIds').isArray(),
  body('shoppingListId').optional().custom(notEmpty),
  isValid,
  async (req, res, next) => {
    const { startDay, endDay, purchasedFoodsIds, shoppingListId } = req.body;
    const { accountId } = res.locals;

    const purchasedFoodsIdsItems: string[] = purchasedFoodsIds;

    await prismaClient.$transaction(async (tx) => {
      if (shoppingListId) {
        const shoppingList = await tx.shoppingList.update({
          where: {
            id: shoppingListId,
          },
          data: {
            accountId,
            startDay,
            endDay,
            purchasedFoodsIds: purchasedFoodsIdsItems,
          },
        });
        res.status(200).send(shoppingList);
        next();
        return;
      }

      const shoppingList = await tx.shoppingList.create({
        data: {
          accountId,
          name: `${startDay} - ${endDay}`,
          startDay,
          endDay,
          purchasedFoodsIds: purchasedFoodsIdsItems,
        },
      });

      res.status(200).send(shoppingList);
      next();
      return;
    });
  }
);

shoppingListRouter.delete(
  '/:id',
  param('id').isUUID(),
  isAuthorized,
  async (req, res, next) => {
    const deleted = await prismaClient.shoppingList.delete({
      where: { id: req.params.id },
    });

    res.status(200).send(deleted);
    next();
    return;
  },
);

export default shoppingListRouter;
