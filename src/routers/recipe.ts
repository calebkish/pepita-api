import express from 'express';
import { body } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
// import { duplicateFood } from '../util/entity/duplicate-food.js';

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

/// Create a recipe
recipeRouter.post(
  '/',
  isAuthorized,
  body('name').trim().notEmpty(),
  isValid,
  async (req, res) => {
    const { name } = req.body;
    const { accountId } = res.locals;
    const recipe = await prismaClient.recipe.create({
      data: {
        name,
        accountId,
        saved: true,
      },
    });

    return res.status(200).send(recipe);
  }
);

// Add a food to a recipe
// recipeRouter.put(
//   '/food',
//   isAuthorized,
//   body('scale').isInt(),
//   body('foodId').isUUID(),
//   body('foodUnitId').optional().isUUID(),
//   body('recipeId').isUUID(),
//   isValid,
//   async (req, res) => {
//     const { recipeId, foodId, scale, foodUnitId } = req.body;
//
//     const recipe = await prismaClient.$transaction(async (tx) => {
//       const dupFoodResponse = await duplicateFood(tx, foodId);
//
//       if (dupFoodResponse === null) {
//         return null;
//       }
//
//       const { duplicateFoodId, foodUnitMap } = dupFoodResponse;
//
//       console.log(dupFoodResponse);
//       if (foodUnitId !== undefined && !dupFoodResponse.foodUnitMap.has(foodUnitId)) {
//         return null;
//       }
//
//       const recipe = await tx.recipe.update({
//         where: {
//           id: recipeId,
//         },
//         data: {
//           foodsOnRecipes: {
//             create: {
//               scale,
//               foodUnitId: foodUnitMap.get(foodUnitId),
//               foodId: duplicateFoodId,
//             },
//           },
//         },
//         include: {
//           foodsOnRecipes: {
//             include: {
//               food: {
//                 include: {
//                   foodUnits: true,
//                 },
//               },
//             },
//           },
//         },
//       });
//
//       return recipe;
//     });
//
//     if (recipe === null) {
//       return res.sendStatus(400);
//     }
//
//     return res.status(200).send(recipe);
//   }
// );


export default recipeRouter;
