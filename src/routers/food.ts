import { Food, FoodCategory } from '@prisma/client';
import express from 'express';
import { body, param, query } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { foodOnRecipeInclude } from './recipe.js';

const foodRouter = express.Router();

// Get all custom Foods &> FoodUnits
foodRouter.get(
  '/',
  isAuthorized,
  async (req, res) => {
    const { accountId } = res.locals;

    const foods = await prismaClient.food.findMany({
      where: {
        accountId,
      },
      include: {
        foodUnits: true,
      },
    });

    return res.status(200).send(foods);
  }
);

// Search for a food
foodRouter.get(
  '/search',
  isAuthorized,
  query('q').trim().notEmpty().isString(),
  // query('brandId').optional().trim().notEmpty().isString(),
  isValid,
  async (req, res) => {

    const search = req.query.q!;
    if (typeof search !== 'string') {
      res.sendStatus(400);
      return;
    }

    let response: Food[] = [];

    // const queriedFoods: Array<Pick<Food, 'id'> & { similarity: number }> = await prismaClient.$queryRaw`
    //   SELECT f.id, f.name, fb.name as brand_name, similarity("indexedName", ${search}) AS similarity
    //   FROM "Food" as f
    //   JOIN "FoodBrand" as fb ON f."foodBrandId" = fb.id
    //   WHERE "indexedName" % ${search}
    //     AND ("accountId" is NULL OR "accountId" = ${accountId})
    //   ORDER BY similarity DESC
    //   LIMIT 20
    // `;

    const source = 'fndds';

    const queriedFoods: Array<Pick<Food, 'id' | 'name'>> = await prismaClient.$queryRaw`
      SELECT f.id, f.name
      FROM "Food" as f
      WHERE true
        AND ${search} <% "indexedName"
        AND "source" = ${source}
      ORDER BY ${search} <<-> "indexedName"
      LIMIT 20
    `;

    // Only return global foods and custom foods the user owns.
    response = (await prismaClient.food.findMany({
      where: {
        id: {
          in: queriedFoods.map(({ id }) => id),
        },
      },
      include: {
        foodUnits: true,
        nutrientsOnFoods: {
          include: {
            nutrient: true,
            unit: true,
          },
        },
        foodBrand: true,
      },
    }));
      // .sort((a, b) => {
      //   const aSimilarity = queriedFoods.find(q => q.id === a.id)?.similarity ?? 0;
      //   const bSimilarity = queriedFoods.find(q => q.id === b.id)?.similarity ?? 0;
      //   return bSimilarity - aSimilarity;
      // });

    // console.log('exact', exactQuery);
    // console.log('fuzzy', fuzzyQuery);

    res.status(200).send(response);
    return;
  },
);

// Get one food by ID
  // If a global food, return it
  // If a custom food, check if user owns it
foodRouter.get(
  '/:foodId',
  isAuthorized,
  param('foodId').isUUID().withMessage('Not a valid food ID'),
  isValid,
  async (req, res) => {
    const { accountId } = res.locals;

    const food = await prismaClient.food.findUnique({
      where: {
        id: req.params.foodId
      },
      include: {
        foodUnits: true,
        nutrientsOnFoods: {
          include: {
            nutrient: true,
            unit: true,
          },
        },
      },
    });

    if (!food) {
      return res.sendStatus(404);
    }

    if (food.accountId && food.accountId !== accountId) {
      return res.sendStatus(403);
    }

    return res.status(200).send(food);
  },
);


// Create Food
foodRouter.post(
  '/',
  isAuthorized,
  body('name').trim().notEmpty(),
  body('category').optional().isUUID(),
  body('servingUnitAmount').isNumeric(),
  body('servingUnitName').trim().notEmpty(),
  body('gramWeight').optional().isNumeric(),
  body('foodUnits[*].servingUnitAmount')
    .if(body('gramWeight').exists())
    .isNumeric(),
  body('footUnits[*].servingUnitName')
    .if(body('gramWeight').exists())
    .notEmpty(),
  body('foodUnits[*].gramWeight')
    .if(body('gramWeight').exists())
    .isNumeric(),
  isValid,
  // validate({ body: createFoodBodySchema }),
  async (req, res) => {
    const { name, category, servingUnitAmount, servingUnitName, baseUnitAmount, foodUnits } = req.body;
    const { accountId } = res.locals;

    let foundCategory: FoodCategory | null = null;
    if (category) {
      foundCategory = await prismaClient.foodCategory.findUnique({
        where: {
          id: category,
        },
      });

      if (foundCategory === null) {
        return res.sendStatus(400);
      }
    }

    const food = await prismaClient.food.create({
      data: {
        name,
        indexedName: name,
        accountId,
        foodCategoryId: foundCategory?.id ?? null,
        baseUnitAmount: baseUnitAmount ?? null,
        foodUnits: {
          createMany: {
            data: [
              {
                name: servingUnitName,
                abbreviation: servingUnitName,
                servingSizeAmount: servingUnitAmount,
                baseUnitAmountRatio: 100,
                foodUnitAmount: 100,
              },
            ],
          },
        },
      },
    });

    res.status(200).send(food);
    return;
  }
);

// Delete Food
  // If the user's role is admin and food is global, delete
  // If custom food and user own it, delete
foodRouter.delete(
  '/',
  isAuthorized,
  body('foodId').isUUID(),
  isValid,
  async (req, res) => {
    const { foodId } = req.body;
    const { accountId, accountRole } = res.locals;

    const food = await prismaClient.food.findUnique({
      where: {
        id: foodId,
      },
    });

    if (!food) {
      return res.sendStatus(404);
    }

    if (accountRole !== 'ADMIN' && food.accountId !== accountId) {
      return res.sendStatus(403);
    }

    res.status(200).send(food);
    return;
  },
);

export default foodRouter;
