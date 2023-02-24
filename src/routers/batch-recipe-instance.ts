import express from "express";
import { body, oneOf } from "express-validator";
import { isAuthorized } from "../middleware/is-authorized.js";
import { isValid } from "../middleware/is-valid.js";
import { isNumber } from "../validators/is-number.js";
import { notEmpty } from "../validators/not-empty.js";
import { prismaClient } from '../db.js';
import { FoodOnRecipeFormArrayItem, foodOnRecipeFormArrayItemValidator } from "../models/food-on-recipe-form-array-item.js";

const batchRecipeInstanceRouter = express.Router();

/// Upsert a batch recipe
batchRecipeInstanceRouter.put(
  '/',
  isAuthorized,
  body('name').custom(notEmpty),
  body('directions').isArray(),
  body('gramWeight').optional({ nullable: true }).custom(isNumber),
  ...foodOnRecipeFormArrayItemValidator,
  body('recipeScale').custom(isNumber),
  oneOf([
    // if this is provided, create a new batch recipe instance w/ this `batchRecipeId` as the base
    [body('owningBatchRecipeId').isUUID(), body('mealId').isUUID()],
    // if this is provided, update this batch recipe using data in body
    body('batchRecipeInstanceId').isUUID(),
  ]),
  isValid,
  async (req, res, next) => {
    const {
      name, foods, gramWeight, directions, batchRecipeInstanceId, recipeScale,
      mealId, owningBatchRecipeId,
    } = req.body;
    const { accountId } = res.locals;

    const foodsOnRecipeItems: FoodOnRecipeFormArrayItem[] = foods;

    await prismaClient.$transaction(async (tx) => {
      if (batchRecipeInstanceId) {
        const recipe = await tx.recipe.update({
          where: {
            id: batchRecipeInstanceId,
          },
          data: {
            name,
            gramWeight,
            scale: recipeScale,
            foodsOnRecipes: {
              deleteMany: [
                {
                  recipeId: batchRecipeInstanceId,
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
          owningBatchRecipeId,
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



export default batchRecipeInstanceRouter;
