import express from 'express';
import bcrypt from 'bcrypt';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { createAccountJwt } from '../util/create-account-jwt.js';
import { body, CustomValidator } from 'express-validator';
import { Account, MealTemplate } from '@prisma/client';
import { isValid } from '../middleware/is-valid.js';
import { isNumber } from '../validators/is-number.js';
import { notEmpty } from '../validators/not-empty.js';

const authRouter = express.Router();

authRouter.post(
  '/register',
  body('email').trim().isEmail().withMessage('The value you entered is not an email'),
  body('password').trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('passwordConfirm').trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
  }),
  isValid,
  async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    let account: Account;
    try {
      account = await prismaClient.account.create({
        data: { email, passwordHash },
      });
    } catch (err) {
      return res.status(500).send({
        errors: { email: 'Provided email can not be used' }
      });
    }

    let token = null;
    try {
      token = await createAccountJwt(account);
    } catch (error) {
      return res.status(500).send('Failed to sign jwt');
    }

    return res
      .status(201)
      .cookie('access_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'none',
        path: '/',
      })
      .send({
        email: account.email,
        role: account.role,
      });
  },
);

authRouter.post(
  '/login',
  body('email').trim().notEmpty().withMessage('Email is required'),
  body('email').trim().isEmail().withMessage('The value you entered is not an email'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  isValid,
  async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const account = await prismaClient.account.findUnique({
      where: { email },
    });

    if (account === null) {
      return res.status(400).send({
        errors: { email: 'Provided email is not valid' }
      });
    };

    const hash = account.passwordHash;

    const match = await bcrypt.compare(password, hash);

    if (!match) {
      return res.status(400).send({
        errors: { password: 'Password is incorrect' }
      });
    }

    let token = null;
    try {
      token = await createAccountJwt(account);
    } catch (error) {
      console.error(error);
      return res.status(500).send('Failed to sign jwt');
    }

    return res
      .status(200)
      .cookie('access_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
      })
      .send({
        email: account.email,
        role: account.role,
      });
  },
);

authRouter.get(
  '/current',
  isAuthorized,
  async (req, res) => {
    const { email, accountId } = res.locals;

    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
      include: {
        mealTemplates: true,
      }
    });

    if (account === null) {
      return res.sendStatus(500);
    }

    return res.status(200).send(account);
  },
);

authRouter.get(
  '/settings',
  isAuthorized,
  async (req, res) => {
    const { email, accountId } = res.locals;

    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
      select: {
        autoCreatedMealTemplates: {
          select: {
            fat: true,
            name: true,
            protein: true,
            calories: true,
            order: true,
            carbohydrates: true,
            id: true,
          },
          orderBy: {
            order: 'asc',
          }
        },
        dailyTargetProtein: true,
        dailyTargetFat: true,
        dailyTargetCarbohydrates: true,
        dailyTargetCalories: true,
      },
    });

    if (account === null) {
      return res.sendStatus(500);
    }

    return res.status(200).send({
      autoCreatedMealTemplates: account.autoCreatedMealTemplates,
      dailyTargetCalories: account.dailyTargetCalories,
      dailyTargetProtein: account.dailyTargetProtein,
      dailyTargetCarbohydrates: account.dailyTargetCarbohydrates,
      dailyTargetFat: account.dailyTargetFat,
    });
  },
);

authRouter.post(
  '/settings',
  isAuthorized,
  body('dailyTargetCalories').custom(isNumber),
  body('dailyTargetProtein').custom(isNumber),
  body('dailyTargetCarbohydrates').custom(isNumber),
  body('dailyTargetFat').custom(isNumber),
  body('autoCreatedMealTemplates[*].name').custom(notEmpty),
  body('autoCreatedMealTemplates[*].order').custom(isNumber),
  body('autoCreatedMealTemplates[*].calories').custom(isNumber),
  body('autoCreatedMealTemplates[*].protein').custom(isNumber),
  body('autoCreatedMealTemplates[*].carbohydrates').custom(isNumber),
  body('autoCreatedMealTemplates[*].fat').custom(isNumber),
  isValid,
  async (req, res) => {
    const { accountId } = res.locals;

    const {
      autoCreatedMealTemplates,
      dailyTargetCalories,
      dailyTargetProtein,
      dailyTargetCarbohydrates,
      dailyTargetFat,
    } = req.body;

    const orders = new Set<number>();
    for (const { order } of autoCreatedMealTemplates) {
      if (orders.has(order)) {
        return res.sendStatus(400);
      }
      orders.add(order);
    }


    const account = await prismaClient.account.update({
      where: { id: accountId },
      data: {
        autoCreatedMealTemplates: {
          deleteMany: {},
          createMany: {
            data: autoCreatedMealTemplates.map((template: any) => ({
              ...template,
              accountId,
            })),
          },
        },
        dailyTargetCalories,
        dailyTargetProtein,
        dailyTargetCarbohydrates,
        dailyTargetFat,
      },
      select: {
        autoCreatedMealTemplates: {
          select: {
            fat: true,
            name: true,
            protein: true,
            calories: true,
            order: true,
            carbohydrates: true,
          },
          orderBy: {
            order: 'asc',
          }
        },
        dailyTargetProtein: true,
        dailyTargetFat: true,
        dailyTargetCarbohydrates: true,
        dailyTargetCalories: true,
      },
    });


    if (account === null) {
      return res.sendStatus(500);
    }

    return res.status(200).send({
      autoCreatedMealTemplates: account.autoCreatedMealTemplates,
      dailyTargetProtein: account.dailyTargetProtein,
      dailyTartgetCalories: account.dailyTargetCalories,
      dailyTargetFat: account.dailyTargetFat,
      dailyTargetCarbohydrates: account.dailyTargetCarbohydrates,
    });
  }
)

export default authRouter;
