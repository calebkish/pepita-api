
import express from 'express';
import { body, param, query } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { notEmpty } from '../validators/not-empty.js';

const mealRouter = express.Router();

mealRouter.delete(
  '/:id',
  isAuthorized,
  param('id').custom(notEmpty),
  isValid,
  async (req, res) => {
    const { accountId } = res.locals;

    await prismaClient.$transaction(async (tx) => {

      const meal = await tx.meal.findUnique({
        where: {
          id: req.params.id,
        },
        include: {
          recipesOnMeals: true,
        },
      });

      if (meal === null) {
        res.sendStatus(400);
        return;
      }

      if (meal.accountId !== accountId) {
        res.sendStatus(400);
        return;
      }

      const recipeIds = meal.recipesOnMeals.map(recipeOnMeal => recipeOnMeal.recipeId);

      await tx.recipe.deleteMany({
        where: {
          id: {
            in: recipeIds,
          },
        },
      });

      const deletedMeal = await tx.meal.delete({
        where: {
          id: meal.id,
        },
      });

      res.status(200).send(deletedMeal);
    });

  },
)

export default mealRouter;
