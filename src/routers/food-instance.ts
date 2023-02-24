import express from "express";
import { body, query } from "express-validator";
import { isAuthorized } from "../middleware/is-authorized.js";
import { isValid } from "../middleware/is-valid.js";
import { isNumber } from "../validators/is-number.js";
import { prismaClient } from '../db.js';
import { notEmpty } from "../validators/not-empty.js";
import { upsertFoodOnMeal } from "../repos/food-instance-repo.js";

const foodInstanceRouter = express.Router();

foodInstanceRouter.get(
  '/',
  isAuthorized,
  query('foodId').custom(notEmpty),
  query('mealId').custom(notEmpty),
  isValid,
  async (req, res, next) => {
    const { foodId, mealId } = req.query;

    if (typeof foodId !== 'string' || typeof mealId !== 'string') {
      res.sendStatus(400);
      next();
      return;
    }

    const foodOnMeal = await prismaClient.foodsOnMeals.findUnique({
      where: {
        foodId_mealId: {
          foodId,
          mealId,
        },
      },
      include: {
        foodUnit: true,
        food: {
          include: {
            foodUnits: true,
            nutrientsOnFoods: {
              include: {
                unit: true,
                nutrient: true,
              },
            },
          },
        },
      },
    });

    res.status(200).send(foodOnMeal);
  },
);

/// Upsert a food instance
foodInstanceRouter.put(
  '/',
  isAuthorized,
  body('foodId').isUUID(),
  body('mealId').isUUID(),
  body('foodUnitId').isUUID(),
  body('scaleDecimal').custom(isNumber),
  body('scaleDenominator').custom(isNumber),
  body('scaleNumerator').custom(isNumber),
  body('scaleBase').custom(isNumber),
  body('shouldUseScaleDecimal').isBoolean(),
  body('halves').isBoolean(),
  body('thirds').isBoolean(),
  body('fourths').isBoolean(),
  body('sixths').isBoolean(),
  body('sixteenths').isBoolean(),
  isValid,
  async (req, res, next) => {
    const foodOnMeal = await upsertFoodOnMeal(req.body);
    res.status(200).send(foodOnMeal);
    next();
    return;
  }
);


foodInstanceRouter.delete(
  '/',
  isAuthorized,
  body('foodId').isUUID(),
  body('mealId').isUUID(),
  isValid,
  async (req, res, next) => {
    const { foodId, mealId } = req.body;
    const deletedFoodInstance = await prismaClient.foodsOnMeals.delete({
      where: {
        foodId_mealId: {
          foodId,
          mealId,
        }
      },
    });
    res.status(200).send(deletedFoodInstance);
    next();
    return;
  },
);

foodInstanceRouter.post(
  '/copy',
  body('mealId').isUUID(),
  body('foodId').isUUID(),
  body('targetMealId').isUUID(),
  isValid,
  async (req, res, next) => {
    const { mealId, foodId, targetMealId } = req.body;

    const foodOnMeal = await prismaClient.foodsOnMeals.findUnique({
      where: {
        foodId_mealId: {
          foodId,
          mealId,
        },
      },
      include: {
        foodUnit: true,
        food: {
          include: {
            foodUnits: true,
            nutrientsOnFoods: {
              include: {
                unit: true,
                nutrient: true,
              },
            },
          },
        },
      },
    });

    if (!foodOnMeal) {
      res.sendStatus(400);
      next();
      return;
    }

    const newFoodOnMeal = await upsertFoodOnMeal({
      ...foodOnMeal,
      mealId: targetMealId,
      foodId: foodId,
    });

    res.status(200).send(newFoodOnMeal);
    next();
    return;
  },
);



export default foodInstanceRouter;
