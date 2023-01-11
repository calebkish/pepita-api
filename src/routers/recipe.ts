import express from 'express';
import { body, param } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { isNumber } from '../validators/is-number.js';
// import { duplicateFood } from '../util/entity/duplicate-food.js';
import { notEmpty } from '../validators/not-empty.js';

const recipeRouter = express.Router();

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
      },
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
    });

    return res.status(200).send(recipes);
  }
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
    });

    if (recipe === null) {
      res.sendStatus(404);
      next();
      return;
    }

    res.status(200).send(recipe);
    next();
    return;
  }
);

/// Create/replace a regular recipe
recipeRouter.put(
  '/',
  isAuthorized,
  body('name').custom(notEmpty),
  body('directions').isArray(),
  body('gramWeight').optional().custom(isNumber),
  body('foods.*.food.id').custom(notEmpty),
  body('foods.*.scale').custom(isNumber),
  body('foods.*.foodUnit.id').custom(notEmpty),
  body('recipeId').optional().custom(notEmpty),
  isValid,
  async (req, res, next) => {
    const { name, foods, gramWeight, directions, recipeId } = req.body;
    const { accountId } = res.locals;

    await prismaClient.$transaction(async (tx) => {
      if (recipeId) {
        // await tx.foodsOnRecipes.deleteMany({
        //   where: { recipeId, },
        // });
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
                data: foods.map(({ food, scale, foodUnit }: any) => ({
                  foodId: food.id,
                  scale,
                  foodUnitId: foodUnit.id,
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
              data: foods.map(({ food, scale, foodUnit }: any) => ({
                foodId: food.id,
                scale,
                foodUnitId: foodUnit.id,
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
    await prismaClient.recipe.delete({
      where: { id: req.params.id },
    });

    res.sendStatus(200);
    next();
    return;
  },
)

export default recipeRouter;
