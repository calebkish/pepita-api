import express from 'express';
import { body, oneOf } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { FoodOnRecipeFormArrayItem, foodOnRecipeFormArrayItemValidator } from '../models/food-on-recipe-form-array-item.js';
import { isNumber } from '../validators/is-number.js';
import { notEmpty } from '../validators/not-empty.js';

const recipeInstanceRouter = express.Router();

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

/// Upsert a regular recipe
recipeInstanceRouter.put(
  '/',
  isAuthorized,
  body('name').custom(notEmpty),
  body('directions').isArray(),
  body('gramWeight').optional({ nullable: true }).custom(isNumber),
  ...foodOnRecipeFormArrayItemValidator,
  body('recipeScale').custom(isNumber),
  oneOf([
    // if this is provided, create a new recipe instance
    body('mealId').isUUID(),
    // if this is provided, update this recipe instance using data in body
    body('recipeInstanceId').custom(notEmpty),
  ]),
  isValid,
  async (req, res, next) => {
    const { name, foods, gramWeight, directions, recipeInstanceId, mealId, recipeScale } = req.body;
    const { accountId } = res.locals;

    const foodsOnRecipeItems: FoodOnRecipeFormArrayItem[] = foods;

    await prismaClient.$transaction(async (tx) => {
      if (recipeInstanceId) {
        const recipe = await tx.recipe.update({
          where: {
            id: recipeInstanceId,
          },
          data: {
            name,
            gramWeight,
            scale: recipeScale,
            foodsOnRecipes: {
              deleteMany: [
                {
                  recipeId: recipeInstanceId,
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
          include: recipeInclude,
        });
        res.status(200).send(recipe);
        next();
        return;
      }

      const recipe = await tx.recipe.create({
        data: {
          name,
          directions,
          accountId,
          gramWeight,
          scale: recipeScale,
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
        include: recipeInclude,
      });
      await tx.recipesOnMeals.create({
        data: {
          mealId,
          recipeId: recipe.id,
        },
      });

      res.status(200).send(recipe);
      next();
      return;
    });
  }
);

export default recipeInstanceRouter;
