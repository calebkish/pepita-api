import express from 'express';
import { body, param } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { difference } from '../util/difference.js';

const dayRouter = express.Router();

const dayInclude = {
  include: {
    mealsOnDays: {
      include: {
        meal: {
          include: {
            mealTemplate: true,
            recipesOnMeals: {
              include: {
                recipe: {
                  include: {
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
                  },
                },
              },
            },
            foodsOnMeals: {
              include: {
                foodUnit: true,
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
              },
            },
          },
        },
      },
    },
  },
};

// Get a day
dayRouter.get(
  '/:day',
  isAuthorized,
  param('day').isDate(),
  isValid,
  async (req, res) => {
    const { accountId } = res.locals;

    const day = await prismaClient.day.findFirst({
      where: {
        accountId,
        day: req.params.day,
      },
      ...dayInclude,
    });

    if (day === null) {
      res.sendStatus(404);
      return;
    }

    day.mealsOnDays = day.mealsOnDays.sort((a, b) => {
      const aOrder = a.meal.mealTemplate?.order;
      const bOrder = b.meal.mealTemplate?.order;

      if (aOrder === undefined && bOrder !== undefined) {
        return 1;
      } else if (aOrder !== undefined && bOrder === undefined) {
        return -1;
      } else if (aOrder === undefined && bOrder === undefined) {
        return 0;
      } else {
        return aOrder! - bOrder!;
      }
    });

    res.status(200).send(day);
    return;
  }
);

// const getDateRange = (start: Date, end: Date) => {
//   for(var arr=[], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate()+1)) {
//       arr.push(new Date(dt));
//   }
//   return arr;
// };
//
// const isoToUtcDate = (iso: string): Date => {
//   const [year, month, day] = iso.split('-');
//
//   if (
//     !year ||
//     Number.isNaN(Number(year)) ||
//     !month ||
//     Number.isNaN(Number(month)) ||
//     !day ||
//     Number.isNaN(Number(day))
//   ) {
//     throw new Error('Failed to convert ISO timestamp to day');
//   }
//
//   return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
// };

// Get a range of days
// dayRouter.get(
//   '/:day/range',
//   isAuthorized,
//   param('start').isDate(),
//   param('end').isDate(),
//   isValid,
//   async (req, res, next) => {
//     const { start, end } = req.params;
//
//     const { accountId } = res.locals;
//
//     const startDate = isoToUtcDate(start);
//     const endDate = isoToUtcDate(end);
//
//     const range = getDateRange(startDate, endDate).map(d => d.toISOString().split('T')[0]);
//
//     const days = await prismaClient.day.findMany({
//       where: {
//         accountId,
//         OR: range.map(day => {
//           return { day };
//         }),
//       },
//       ...dayInclude,
//     });
//
//     if (days === null || days.length === 0) {
//       res.sendStatus(404);
//       return;
//     }
//
//     for (const day of days) {
//       day.mealsOnDays = day.mealsOnDays.sort((a, b) => {
//         const aOrder = a.meal.mealTemplate?.order;
//         const bOrder = b.meal.mealTemplate?.order;
//
//         if (aOrder === undefined && bOrder !== undefined) {
//           return 1;
//         } else if (aOrder !== undefined && bOrder === undefined) {
//           return -1;
//         } else if (aOrder === undefined && bOrder === undefined) {
//           return 0;
//         } else {
//           return aOrder! - bOrder!;
//         }
//       });
//     }
//
//     res.status(200).send(days);
//     next();
//     return;
//   }
// );

// Create meal and add onto day
dayRouter.post(
  '/:day/meal',
  isAuthorized,
  param('day').isDate(),
  body().custom((body) => {
    return (
      (
        body.name &&
        typeof body.name === 'string'
      ) || (
        body.mealTemplateIds &&
        Array.isArray(body.mealTemplateIds) &&
        body.mealTemplateIds.every((id: any) => typeof id === 'string')
      )
    );
  }),
  isValid,
  async (req, res, next) => {
    const { accountId } = res.locals;

    await prismaClient.$transaction(async (tx) => {

      let day = await tx.day.findFirst({
        where: {
          day: req.params.day,
          accountId,
        },
        include: {
          mealsOnDays: {
            include: {
              meal: true,
            },
          },
        },
      });

      if (day === null) {
        // Create day if it doesn't exist
        day = await tx.day.create({
          data: {
            day: req.params.day,
            accountId,
          },
          include: {
            mealsOnDays: {
              include: {
                meal: true,
              },
            },
          },
        });

        // Just in case
        if (day === null) {
          res.sendStatus(400);
          next();
          return;
        }
      }

      if (req.body.name) {
        const newDay = await tx.day.update({
          where: {
            id: day.id,
          },
          data: {
            mealsOnDays: {
              create: {
                meal: {
                  create: {
                    name: req.body.name,
                    accountId,
                  },
                },
              },
            },
          },
        });
        res.status(200).send(newDay);
        next();
        return;
      }

      const mealTemplateIdsAlreadyOnDay = new Set<string>(
        day.mealsOnDays
          .map(mealOnDay => mealOnDay.meal.mealTemplateId)
          .filter((id): id is string => id !== null),
      );

      const mealsFromTemplatesToCreate = difference<string>(new Set(req.body.mealTemplateIds), mealTemplateIdsAlreadyOnDay);

      if (mealsFromTemplatesToCreate.size === 0) {
        res.status(400).send('Tried to create meal template that already exists on the day');
        next();
        return;
      }

      const mealTemplates = await tx.mealTemplate.findMany({
        where: {
          id: {
            in: [...mealsFromTemplatesToCreate],
          },
        },
      });

      if (mealTemplates === null || mealTemplates.length === 0) {
        res.sendStatus(400);
        next();
        return;
      }

      for (const template of mealTemplates) {
        await tx.day.update({
          where: {
            id: day.id,
          },
          data: {
            mealsOnDays: {
              create: {
                meal: {
                  create: {
                    name: template.name,
                    mealTemplateId: template.id,
                    accountId,
                  },
                },
              },
            },
          },
        });
      }

      res.status(200).send({});
      next();
      return;
    });

  },
);

// Create day if it doesn't exist + optionally add auto generated meals
// dayRouter.post(
//   '/:day',
//   isAuthorized,
//   param('day').isDate(),
//   body('shouldAddMealTemplates').optional().isBoolean(),
//   isValid,
//   async (req, res) => {
//     const { accountId } = res.locals;
//
//     await prismaClient.$transaction(async (tx) => {
//
//       const dayParam = req.params.day;
//       const day = await tx.day.findFirst({
//         where: {
//           accountId,
//           day: dayParam,
//         },
//       });
//
//       if (day) {
//         res.sendStatus(400);
//         return;
//       }
//
//       const account = await tx.account.findUnique({
//         where: { id: accountId },
//         include: {
//           autoCreatedMealTemplates: {
//             orderBy: {
//               order: 'asc',
//             }
//           },
//         },
//       });
//
//       const newDay = await tx.day.create({
//         data: {
//           day: dayParam,
//           accountId,
//         },
//       });
//
//       if (req.body.shouldAddMealTemplates) {
//         const templatesInput = account!.autoCreatedMealTemplates.map(template => ({
//           mealTemplateId: template.id,
//           name: template.name,
//           accountId,
//         })) ?? [];
//
//         const mealInserts = templatesInput.map(async (template) => {
//           return await tx.meal.create({
//             data: template,
//           });
//         });
//
//         const meals = await Promise.allSettled(mealInserts);
//
//         const mealsInput = meals
//           .map(meal => {
//             if (meal.status !== 'fulfilled') return null;
//             return {
//               mealId: meal.value.id,
//               dayId: newDay.id,
//             };
//           })
//           .filter((meal): meal is { mealId: string, dayId: string } => !!meal);
//
//         await tx.mealsOnDays.createMany({
//           data: mealsInput,
//         });
//       }
//
//       const updatedDay = await tx.day.findFirst({
//         where: {
//           day: dayParam,
//           accountId,
//         },
//         ...dayInclude,
//       });
//
//       res.status(200).send(updatedDay);
//       return;
//
//     });
//   },
// );

// Delete day and all meals and recipes within it.
dayRouter.delete(
  '/:day',
  isAuthorized,
  param('day').isDate(),
  isValid,
  async (req, res) => {
    const { accountId } = res.locals;

    await prismaClient.$transaction(async (tx) => {

      const day = await tx.day.findFirst({
        where: {
          day: req.params.day,
          accountId,
        },
        ...dayInclude,
      });

      if (day === null) {
        res.sendStatus(400);
        return;
      }

      // const recipeIdsFromRecipesOnDays = day.recipesOnDays.map(rod => rod.recipeId);

      const recipeIdsFromMealsOnDays = day.mealsOnDays
        .map(mod => mod.meal.recipesOnMeals)
        .flat()
        .map(rom => rom.recipeId);

      const mealIdsFromMealsOnDays = day.mealsOnDays.map(mod => mod.mealId);

      await tx.recipe.deleteMany({
        where: {
          id: {
            // in: recipeIdsFromRecipesOnDays.concat(recipeIdsFromMealsOnDays),
            in: recipeIdsFromMealsOnDays,
          },
        },
      });

      await tx.meal.deleteMany({
        where: {
          id: {
            in: mealIdsFromMealsOnDays,
          }
        },
      });

      await tx.day.delete({
        where: {
          id: day.id,
        }
      });

      res.sendStatus(200);
    });
  },
);

export default dayRouter;
