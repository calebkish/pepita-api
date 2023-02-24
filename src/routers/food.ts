import { Food, FoodCategory, Recipe } from '@prisma/client';
import express from 'express';
import { body, oneOf, param, query } from 'express-validator';
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
  query('brandId').optional().trim().notEmpty().isString(),
  isValid,
  async (req, res) => {

    const search = req.query.q!;
    if (typeof search !== 'string') {
      res.sendStatus(400);
      return;
    }

    const brandId = req.query.brandId;
    if (brandId && typeof brandId !== 'string') {
      res.sendStatus(400);
      return;
    }

    const { accountId } = res.locals;

    let response: Food[] = [];

    let queriedFoods: Array<Pick<Food, 'id'> & { similarity: number }> = [];
    if (brandId) {
      queriedFoods = await prismaClient.$queryRaw`
        SELECT id, similarity("name", ${search}) AS similarity
        FROM "Food"
        WHERE "name" % ${search}
          AND "foodBrandId" = ${brandId}
          AND ("accountId" is NULL OR "accountId" = ${accountId})
        ORDER BY similarity DESC
        LIMIT 20
      `;
    } else {
      queriedFoods = await prismaClient.$queryRaw`
        SELECT id, similarity("name", ${search}) AS similarity
        FROM "Food"
        WHERE "name" % ${search}
          AND ("accountId" is NULL OR "accountId" = ${accountId})
        ORDER BY similarity DESC
        LIMIT 20
      `;
    }

    // Only return global foods and custom foods the user owns.
    response = (await prismaClient.food.findMany({
      where: {
        id: {
          in: queriedFoods.map(({ id }) => id),
        },
        // OR: [
        //   { accountId: null },
        //   { accountId },
        // ]
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
    }))
      .sort((a, b) => {
        const aSimilarity = queriedFoods.find(q => q.id === a.id)?.similarity ?? 0;
        const bSimilarity = queriedFoods.find(q => q.id === b.id)?.similarity ?? 0;
        return bSimilarity - aSimilarity;
      });

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

    return res.status(200).send(food);
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

    return res.status(200).send(food);
  },
);

// Add Unit on Food
// foodRouter.put(
//   '/unit',
//   isAuthorized,
//   body('foodId').isUUID(),
//   body('unitToGramRatio').isNumeric(),
//   body('unitId').isUUID(),
//   isValid,
//   async (req, res) => {
//     const { foodId, unitId, unitToGramRatio } = req.body;
//
//     const unit = await prismaClient.unit.findUnique({
//       where: { id: unitId },
//     });
//
//     if (!unit) {
//       return res.sendStatus(404);
//     }
//
//     const { name, abbreviation } = unit;
//
//     const food = await prismaClient.food.update({
//       where: {
//         id: foodId,
//       },
//       data: {
//         foodUnits: {
//           create: {
//             unitToGramRatio,
//             name,
//             abbreviation,
//           },
//         },
//       },
//       include: {
//         foodUnits: true,
//       },
//     });
//
//     return res.status(200).send(food);
//   },
// );

// Add custom FoodUnit on Food
// foodRouter.put(
//   '/custom-unit',
//   isAuthorized,
//   body('foodId').isUUID(),
//   body('unitToGramRatio').isNumeric(),
//   body('name').trim().notEmpty(),
//   body('abbreviation').trim().notEmpty(),
//   body('stepNumerator').isInt(),
//   body('stepDenominator').isInt(),
//   isValid,
//   async (req, res) => {
//     const { foodId, unitToGramRatio, name, abbreviation } = req.body;
//
//     const food = await prismaClient.food.update({
//       where: {
//         id: foodId,
//       },
//       data: {
//         foodUnits: {
//           create: {
//             unitToGramRatio,
//             name,
//             abbreviation,
//           },
//         },
//       },
//     });
//
//     return res.status(200).send(food);
//   }
// );


// PATCH endpoint to update a FoodUnit on a Food

// Delete FoodUnit on Food
foodRouter.delete(
  '/unit',
  isAuthorized,
  body('foodUnitId').isUUID(),
  isValid,
  async (req, res) => {
    const { foodUnitId } = req.body;

    const foodUnit = await prismaClient.foodUnit.delete({
      where: {
        id: foodUnitId,
      },
    });

    return res.status(200).send(foodUnit);
  }
);

export default foodRouter;
