import express from "express";
import { body } from "express-validator";
import { isAuthorized } from "../middleware/is-authorized.js";
import { isValid } from "../middleware/is-valid.js";
import { isNumber } from "../validators/is-number.js";
import { notEmpty } from "../validators/not-empty.js";
import { prismaClient } from '../db.js';
import { Food, FoodsOnRecipes, FoodUnit } from "@prisma/client";

const batchRecipeRouter = express.Router();

interface FoodOnRecipeFormArrayItem {
  food: Food;
  scale: FoodsOnRecipes['scale'];
  foodUnit: FoodUnit;
  scaledToRecipe: number;
}

/// Upsert a batch recipe
batchRecipeRouter.put(
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

    const foodsOnRecipeItems: FoodOnRecipeFormArrayItem[] = foods;

    await prismaClient.$transaction(async (tx) => {
      if (recipeId) {
        const recipe = await tx.recipe.update({
          where: {
            id: recipeId,
          },
          data: {
            isBatchRecipe: true,
            name,
            gramWeight,
            foodsOnRecipes: {
              deleteMany: [
                {
                  recipeId,
                }
              ],
              createMany: {
                data: foodsOnRecipeItems.map(({ food, scale, foodUnit }) => ({
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
          isBatchRecipe: true,
          name,
          directions,
          saved: true,
          accountId,
          gramWeight,
          foodsOnRecipes: {
            createMany: {
              data: foodsOnRecipeItems.map(({ food, scale, foodUnit }) => ({
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

export default batchRecipeRouter;
