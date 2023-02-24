import { Recipe } from '@prisma/client';
import express from 'express';
import { body, param, query } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { FoodOnRecipeFormArrayItem, foodOnRecipeFormArrayItemValidator } from '../models/food-on-recipe-form-array-item.js';
import { isNumber } from '../validators/is-number.js';
import { notEmpty } from '../validators/not-empty.js';

const recipeRouter = express.Router();

export const foodOnRecipeInclude = {
  foodsOnRecipes: {
    include: {
      food: {
        include: {
          foodUnits: true,
          nutrientsOnFoods: {
            include: {
              nutrient: true,
              unit: true,
            }
          }
        },
      },
      foodUnit: true,
    },
  },
};

// Get all saved Recipes &> Foods &> FoodUnits
recipeRouter.get(
  '/',
  isAuthorized,
  async(req, res) => {
    const { accountId } = res.locals;

    const recipes = await prismaClient.recipe.findMany({
      where: {
        accountId,
        saved: true,
        owningBatchRecipeId: null,
      },
      include: foodOnRecipeInclude,
    });

    return res.status(200).send(recipes);
  }
);

// Search for a recipe
recipeRouter.get(
  '/search',
  isAuthorized,
  query('q').trim().notEmpty().isString(),
  query('batched').optional().isBoolean(),
  isValid,
  async (req, res) => {
    const shouldFetchBatched = req.query.batched === 'true';

    const search = req.query.q!;
    if (typeof search !== 'string') {
      res.sendStatus(400);
      return;
    }

    const { accountId } = res.locals;

    let response: Recipe[] = [];

    response = await prismaClient.recipe.findMany({
      where: {
        name: {
          contains: search,
        },
        accountId,
        saved: true,
      },
      include: foodOnRecipeInclude,
      take: 20,
    });

    // if (shouldFetchBatched) {
    //   response = await prismaClient.recipe.findMany({
    //     where: {
    //       name: {
    //         contains: search,
    //       },
    //       accountId,
    //       isBatchRecipe: true,
    //     },
    //     include: foodOnRecipeInclude,
    //     take: 10,
    //   });
    // } else {
    //   response = await prismaClient.recipe.findMany({
    //     where: {
    //       name: {
    //         contains: search,
    //       },
    //       accountId,
    //       isBatchRecipe: false,
    //       saved: true,
    //     },
    //     include: foodOnRecipeInclude,
    //     take: 10,
    //   });
    // }

    res.status(200).send(response);
    return;
  },
);

// Get a Recipe
recipeRouter.get(
  '/:id',
  isAuthorized,
  param('id').custom(notEmpty),
  isValid,
  async(req, res, next) => {
    const { accountId } = res.locals;

    const recipe = await prismaClient.recipe.findUnique({
      where: {
        id: req.params.id,
      },
      include: foodOnRecipeInclude,
    });

    if (recipe === null) {
      res.sendStatus(404);
      return;
    }

    res.status(200).send(recipe);
    return;
  }
);

/// Upsert a regular recipe
recipeRouter.put(
  '/',
  isAuthorized,
  body('name').custom(notEmpty),
  body('directions').isArray(),
  body('gramWeight').optional({ nullable: true }).custom(isNumber),
  ...foodOnRecipeFormArrayItemValidator,
  body('recipeId').optional().custom(notEmpty),
  isValid,
  async (req, res, next) => {
    const { name, foods, gramWeight, directions, recipeId } = req.body;
    const { accountId } = res.locals;

    const foodsOnRecipeItems: FoodOnRecipeFormArrayItem[] = foods;

    await prismaClient.$transaction(async (tx) => {
      if (recipeId) {
        const recipe = await tx.recipe.update({
          where: {
            id: recipeId,
          },
          data: {
            name,
            gramWeight,
            foodsOnRecipes: {
              deleteMany: [
                {
                  recipeId,
                }
              ],
              createMany: {
                data: foodsOnRecipeItems.map(foodOnRecipe => ({
                  foodId: foodOnRecipe.food.id,
                  scaleDecimal: foodOnRecipe.scaleDecimal,
                  scaleDenominator: foodOnRecipe.scaleDenominator,
                  scaleNumerator: foodOnRecipe.scaleNumerator,
                  scaleBase: foodOnRecipe.scaleBase,
                  shouldUseScaleDecimal: foodOnRecipe.shouldUseScaleDecimal,
                  halves: foodOnRecipe.halves,
                  thirds: foodOnRecipe.thirds,
                  fourths: foodOnRecipe.fourths,
                  sixths: foodOnRecipe.sixths,
                  eighths: foodOnRecipe.eighths,
                  sixteenths: foodOnRecipe.sixteenths,
                  foodUnitId: foodOnRecipe.foodUnit.id,
                })),
              },
            },
          },
          include: {
            foodsOnRecipes: {
              include: {
                food: {
                  include: {
                    foodUnits: true,
                  },
                },
                foodUnit: true,
              },
            },
          },
        });
        res.status(200).send(recipe);
        next();
        return;
      }

      const recipe = await tx.recipe.create({
        data: {
          name,
          directions,
          saved: true,
          accountId,
          gramWeight,
          foodsOnRecipes: {
            createMany: {
              data: foodsOnRecipeItems.map(foodOnRecipe => ({
                foodId: foodOnRecipe.food.id,
                scaleDecimal: foodOnRecipe.scaleDecimal,
                scaleDenominator: foodOnRecipe.scaleDenominator,
                scaleNumerator: foodOnRecipe.scaleNumerator,
                scaleBase: foodOnRecipe.scaleBase,
                shouldUseScaleDecimal: foodOnRecipe.shouldUseScaleDecimal,
                halves: foodOnRecipe.halves,
                thirds: foodOnRecipe.thirds,
                fourths: foodOnRecipe.fourths,
                sixths: foodOnRecipe.sixths,
                eighths: foodOnRecipe.eighths,
                sixteenths: foodOnRecipe.sixteenths,
                foodUnitId: foodOnRecipe.foodUnit.id,
              })),
            },
          },
        },
        include: {
          foodsOnRecipes: {
            include: {
              food: {
                include: {
                  foodUnits: true,
                },
              },
              foodUnit: true,
            },
          },
        },
      });

      res.status(200).send(recipe);
      next();
      return;
    });
  }
);

recipeRouter.delete(
  '/:id',
  param('id').isUUID(),
  isAuthorized,
  async (req, res, next) => {
    const deletedRecipe = await prismaClient.recipe.delete({
      where: { id: req.params.id },
    });

    res.status(200).send(deletedRecipe);
    next();
    return;
  },
);

recipeRouter.post(
  '/copy',
  body('mealId').isUUID(),
  body('recipeId').isUUID(),
  body('targetMealId').isUUID(),
  isValid,
  async (req, res, next) => {
    const { mealId, recipeId, targetMealId } = req.body;

    const recipeOnMeal = await prismaClient.recipesOnMeals.findUnique({
      where: {
        recipeId_mealId: {
          recipeId,
          mealId,
        },
      },
      include: {
        recipe: {
          include: {
            foodsOnRecipes: true,
          },
        },
      },
    });

    if (!recipeOnMeal) {
      res.sendStatus(400);
      next();
      return;
    }

    const newRecipeOnMeal = await prismaClient.recipesOnMeals.create({
      data: {
        meal: {
          connect: {
            id: targetMealId,
          },
        },
        scale: recipeOnMeal.scale,
        recipe: {
          create: {
            name: recipeOnMeal.recipe.name,
            accountId: recipeOnMeal.recipe.accountId,
            saved: recipeOnMeal.recipe.saved,
            scale: recipeOnMeal.recipe.scale,
            directions: recipeOnMeal.recipe.directions,
            gramWeight: recipeOnMeal.recipe.gramWeight,
            isBatchRecipe: recipeOnMeal.recipe.isBatchRecipe,
            owningBatchRecipeId: recipeOnMeal.recipe.owningBatchRecipeId,
            isBatchRecipeEaten: recipeOnMeal.recipe.isBatchRecipeEaten,
            foodsOnRecipes: {
              createMany: {
                data: recipeOnMeal.recipe.foodsOnRecipes.map(food => {
                  return {
                    foodId: food.foodId,
                    note: food.note,
                    scaleBase: food.scaleBase,
                    scaleNumerator: food.scaleNumerator,
                    scaleDenominator: food.scaleDenominator,
                    scaleDecimal: food.scaleDecimal,
                    shouldUseScaleDecimal: food.shouldUseScaleDecimal,
                    halves: food.halves,
                    thirds: food.thirds,
                    fourths: food.fourths,
                    sixths: food.sixths,
                    eighths: food.eighths,
                    sixteenths: food.sixteenths,
                    foodUnitId: food.foodUnitId,
                  };
                }),
              },
            },
          },
        },
      },
    });

    res.status(200).send(newRecipeOnMeal);
    next();
    return;
  },
);

export default recipeRouter;
