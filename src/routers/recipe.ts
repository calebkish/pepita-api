import express from 'express';
import { body, param, query } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { isNumber } from '../validators/is-number.js';
// import { duplicateFood } from '../util/entity/duplicate-food.js';
import { notEmpty } from '../validators/not-empty.js';

const recipeRouter = express.Router();

export const recipeInclude = {
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
      },
      include: recipeInclude,
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
      include: recipeInclude,
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


// Search for a recipe
// recipeRouter.get(
//   '/search',
//   isAuthorized,
//   query('q').trim().notEmpty().isString(),
//   isValid,
//   async (req, res) => {
//     const search = req.query.q!;
//
//     if (Array.isArray(search) || typeof search === 'object') {
//       return res.sendStatus(400);
//     }
//
//     const formattedSearch = search.replaceAll(/\s+/g, '|');
//
//     const { accountId } = res.locals;
//
//     const recipes = await prismaClient.recipe.findMany({
//       where: {
//         name: {
//           search: formattedSearch,
//         },
//         accountId,
//         isBatchRecipe: false,
//       },
//       include: recipeInclude,
//       take: 10,
//     });
//
//     // Only return global foods and custom foods the user owns.
//     return res.status(200).send(recipes);
//   },
// );

/// Upsert a regular recipe
recipeRouter.put(
  '/',
  isAuthorized,
  body('name').custom(notEmpty),
  body('directions').isArray(),
  body('gramWeight').optional({ nullable: true }).custom(isNumber),
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
    const deletedRecipe = await prismaClient.recipe.delete({
      where: { id: req.params.id },
    });

    res.status(200).send(deletedRecipe);
    next();
    return;
  },
)

export default recipeRouter;
