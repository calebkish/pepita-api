import { FoodCategory } from '@prisma/client';
import express from 'express';
import { AllowedSchema, Validator } from 'express-json-validator-middleware';
import { body, param, query } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';

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
  isValid,
  async (req, res) => {
    const search = req.query.q!;

    if (Array.isArray(search) || typeof search === 'object') {
      return res.sendStatus(400);
    }

    const formattedSearch = search
      .replaceAll(/\s+/g, '&');

    const { accountId } = res.locals;

    const foods = await prismaClient.food.findMany({
      where: {
        name: {
          search: formattedSearch,
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
      },
      take: 10,
    });

    // Only return global foods and custom foods the user owns.
    return res.status(200).send(foods.filter(food => {
      const isGlobal = food.accountId === null;
      return isGlobal || food.accountId === accountId;
    }));
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
      },
    });

    if (!food) {
      return res.sendStatus(404);
    }

    if (food.accountId && food.accountId !== accountId) {
      return res.sendStatus(403);
    }

    return res.status(200).send(food);
  }
);

// const createFoodBodySchema: AllowedSchema = {
//   type: 'object',
//   required: ['name'],
//   properties: {
//     name: {
//       type: 'string',
//     },
//     gramWeight: {
//       type: 'number',
//     },
//     foodCategory: {
//       type: 'string',
//     },
//   }
// };

// const { validate } = new Validator({});

/*
{
  "name": "salmon",
  "category": "e3f9435f-172a-476f-a1ca-48fff59897e8",
  "servingUnitAmount": 1,
  "servingUnitName": "fillet",
  "gramWeight": 555,
  "foodUnits": [
    {
      "servingUnitAmount": 1,
      "servingUnitName": "cup",
      "gramWeight": 300
    }
  ],
  "calories": 100,
  "protein": 10,
  "carbs": 10,
  "fat": 10
}
*/

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
    const { name, category, servingUnitAmount, servingUnitName, gramWeight, foodUnits } = req.body;
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
        gramWeight: gramWeight ?? null,
        foodUnits: {
          createMany: {
            data: [
              {
                name: servingUnitName,
                abbreviation: servingUnitName,
                servingSizeAmount: servingUnitAmount,
                unitToGramRatio: 100,
                gramWeight: 100,
              }
            ]
          }
        }
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
