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
  batchRecipes: true,
  batchRecipe: {
    include: {
      batchRecipes: {
        include: {
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
        },
      },
    },
  },
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
  async (req, res) => {
    const { accountId } = res.locals;

    const recipes = await prismaClient.recipe.findMany({
      where: {
        accountId,
        saved: true,
        owningBatchRecipeId: null,
      },
    });

    return res.status(200).send(recipes);
  }
);

// Search for a recipe
recipeRouter.get(
  '/search',
  isAuthorized,
  query('q').trim().notEmpty().isString(),
  isValid,
  async (req, res) => {
    const search = req.query.q!;
    if (typeof search !== 'string') {
      res.sendStatus(400);
      return;
    }

    const { accountId } = res.locals;

    const queried: Array<Pick<Recipe, 'id' | 'name' | 'isBatchRecipe'> & { similarity: number }> = await prismaClient.$queryRaw`
      SELECT id, name, "isBatchRecipe", similarity("name", ${search}) AS similarity
      FROM "Recipe"
      WHERE true
        AND ("name" % ${search})
        AND ("accountId" = ${accountId})
        AND ("saved" = true)
      ORDER BY similarity DESC
      LIMIT 20
    `;

    res.status(200).send(queried);
    return;
  },
);

// Get a Recipe
recipeRouter.get(
  '/:id',
  isAuthorized,
  param('id').custom(notEmpty),
  isValid,
  async(req, res) => {
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

    console.log('dirs:', directions);

    const foodsOnRecipeItems: FoodOnRecipeFormArrayItem[] = foods;

    await prismaClient.$transaction(async (tx) => {
      if (recipeId) {
        const recipe = await tx.recipe.update({
          where: {
            id: recipeId,
          },
          data: {
            name,
            directions,
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
