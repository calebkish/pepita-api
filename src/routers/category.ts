import express from 'express';
import { prismaClient } from '../db.js';
import { isAuthorized } from '../middleware/is-authorized.js';

const categoryRouter = express.Router();

// Get all categories
categoryRouter.get(
  '/',
  isAuthorized,
  async (req, res) => {
    const units = await prismaClient.foodCategory.findMany();
    return res.status(200).send(units);
  },
);

export default categoryRouter;
