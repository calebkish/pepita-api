import express from 'express';
import bcrypt from 'bcrypt';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { createAccountJwt } from '../util/create-account-jwt.js';
import { body } from 'express-validator';
import { Account } from '@prisma/client';
import { isValid } from '../middleware/is-valid.js';
import { isNumber } from '../validators/is-number.js';
import { notEmpty } from '../validators/not-empty.js';
import { generatePhrase } from '../util/words.js';

const authRouter = express.Router();

authRouter.post(
  '/register',
  body('username').trim().notEmpty()
    .withMessage('Enter a username'),
  body('password').trim().isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('passwordConfirm').trim()
    .custom((passwordConfirm, { req }) => {
      if (passwordConfirm !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  isValid,
  async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    let account: Account;
    try {
      account = await prismaClient.account.create({
        data: {
          username,
          passwordHash,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send({
        errors: { username: 'Provided username can not be used' }
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
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      })
      .send({
        username: account.username,
        role: account.role,
      });
  },
);

authRouter.post(
  '/trial-register',
  async (req, res) => {
    const phrase = generatePhrase(4);
    console.log(phrase);

    const username = phrase;
    const password = phrase;

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    const expirationTimestamp = (() => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return date;
    })();

    let account: Account;
    try {
      account = await prismaClient.account.create({
        data: {
          username,
          passwordHash,
          role: 'TRIAL',
          expirationTimestamp,
        },
      });
    } catch (err) {
      return res.status(500).send({
        errors: { username: 'Provided username can not be used' }
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
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      })
      .send({
        username: account.username,
        role: account.role,
        expirationTimestamp: account.expirationTimestamp,
      });
  },
);

authRouter.post(
  '/login',
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  isValid,
  async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const account = await prismaClient.account.findUnique({
      where: { username },
    });

    if (account === null) {
      return res.status(400).send({
        errors: { username: 'Provided username is not valid' }
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
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      })
      .send({
        username: account.username,
        role: account.role,
      });
  },
);

authRouter.post(
  '/logout',
  isAuthorized,
  async (req, res) => {
    return res
      .clearCookie('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      })
      .status(200)
      .send({ status: 'success' });
  },
);

authRouter.get(
  '/current',
  isAuthorized,
  async (req, res) => {
    const { accountId } = res.locals;

    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
      include: {
        mealTemplates: true,
      }
    });

    if (account === null) {
      return res
        .clearCookie('access_token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
        .sendStatus(500);
    }

    return res.status(200).send(account);
  },
);

authRouter.get(
  '/settings',
  isAuthorized,
  async (req, res) => {
    const { accountId } = res.locals;

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
  async (req, res, next) => {
    const { accountId } = res.locals;

    const {
      dailyTargetCalories,
      dailyTargetProtein,
      dailyTargetCarbohydrates,
      dailyTargetFat,
    } = req.body;

    const autoCreatedMealTemplates: Array<{
      name: string,
      order: number,
      calories: number,
      protein: number,
      carbohydrates: number,
      fat: number,
    }> = req.body.autoCreatedMealTemplates;

    const orders = new Set<number>();
    for (const { order } of autoCreatedMealTemplates) {
      if (orders.has(order)) {
        res.sendStatus(400);
        next();
        return;
      }
      orders.add(order);
    }

    const account = await prismaClient.account.update({
      where: { id: accountId },
      data: {
        autoCreatedMealTemplates: {
          deleteMany: {},
          createMany: {
            // @ts-ignore
            data: autoCreatedMealTemplates.map(template => {
              return {
                ...template,
                accountId,
              };
            }),
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
      res.sendStatus(500);
      next();
      return;
    }

    res.status(200).send({
      autoCreatedMealTemplates: account.autoCreatedMealTemplates,
      dailyTargetProtein: account.dailyTargetProtein,
      dailyTartgetCalories: account.dailyTargetCalories,
      dailyTargetFat: account.dailyTargetFat,
      dailyTargetCarbohydrates: account.dailyTargetCarbohydrates,
    });
    next();
    return;
  }
)

export default authRouter;
