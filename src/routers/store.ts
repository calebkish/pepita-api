import express from 'express';
import { body, param } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';
import { notEmpty } from '../validators/not-empty.js';

const storeRouter = express.Router();

// Get all stores
storeRouter.get(
  '/',
  isAuthorized,
  async(req, res) => {
    const { accountId } = res.locals;

    const stores = await prismaClient.store.findMany({
      where: { accountId },
    });

    return res.status(200).send(stores);
  },
);


// Get a store
storeRouter.get(
  '/:id',
  isAuthorized,
  param('id').custom(notEmpty),
  isValid,
  async(req, res, next) => {
    const { accountId } = res.locals;
    const { id } = req.params;

    const store = await prismaClient.store.findUnique({
      where: { id },
      include: {
        locations: true,
      },
    });

    if (store === null) {
      res.sendStatus(404);
      next();
      return;
    }

    res.status(200).send(store);
    next();
    return;
  },
);

/// Upsert a store
storeRouter.put(
  '/',
  isAuthorized,
  body('name').custom(notEmpty),
  body('locations').isArray(),
  body('storeId').optional().custom(notEmpty),
  isValid,
  async (req, res, next) => {
    const { name, locations, storeId } = req.body;
    const { accountId } = res.locals;

    const locationItems: string[] = locations;

    await prismaClient.$transaction(async (tx) => {
      if (storeId) {
        const store = await tx.store.update({
          where: {
            id: storeId,
          },
          data: {
            name,
            accountId,
            locations: {
              deleteMany: [
                {
                  storeId,
                }
              ],
              createMany: {
                data: locationItems.map(l => ({
                  name: l,
                  accountId,
                })),
              },
            },
          },
        });
        res.status(200).send(store);
        next();
        return;
      }

      const store = await tx.store.create({
        data: {
          name,
          accountId,
          locations: {
            createMany: {
              data: locationItems.map(l => ({
                name: l,
                accountId,
              })),
            },
          },
        },
        include: {
          locations: true,
        },
      });

      res.status(200).send(store);
      next();
      return;
    });
  }
);

storeRouter.delete(
  '/:id',
  param('id').isUUID(),
  isAuthorized,
  async (req, res, next) => {
    const deletedStore = await prismaClient.store.delete({
      where: { id: req.params.id },
    });

    res.status(200).send(deletedStore);
    next();
    return;
  },
);

export default storeRouter;
