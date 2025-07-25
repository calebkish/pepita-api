import express from "express";
import { body } from "express-validator";
import { isAuthorized } from "../middleware/is-authorized.js";
import { isValid } from "../middleware/is-valid.js";
import { isNumber } from "../validators/is-number.js";
import { notEmpty } from "../validators/not-empty.js";
import { prismaClient } from '../db.js';
import { FoodOnRecipeFormArrayItem, foodOnRecipeFormArrayItemValidator } from "../models/food-on-recipe-form-array-item.js";

const batchRecipeRouter = express.Router();

/// Upsert a batch recipe
batchRecipeRouter.put(
  '/',
  isAuthorized,
  body('name').custom(notEmpty),
  body('directions').isArray(),
  body('gramWeight').optional({ nullable: true }).custom(isNumber),
  ...foodOnRecipeFormArrayItemValidator,
  body('batchRecipeId').optional().custom(notEmpty),
  isValid,
  async (req, res, next) => {
    const { name, foods, gramWeight, directions, batchRecipeId } = req.body;
    const { accountId } = res.locals;

    const foodsOnRecipeItems: FoodOnRecipeFormArrayItem[] = foods;

    await prismaClient.$transaction(async (tx) => {
      if (batchRecipeId) {
        const recipe = await tx.recipe.update({
          where: {
            id: batchRecipeId,
          },
          data: {
            isBatchRecipe: true,
            name,
            gramWeight,
            foodsOnRecipes: {
              deleteMany: [
                {
                  recipeId: batchRecipeId,
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
          saved: true,
          isBatchRecipe: true,
          name,
          directions,
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



export default batchRecipeRouter;
