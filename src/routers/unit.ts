import express from 'express';
import { body, checkSchema, validationResult } from 'express-validator';
import { prismaClient } from '../db.js';
import { isAdmin } from '../middleware/is-admin.js';
import { isAuthorized } from '../middleware/is-authorized.js';
import { isValid } from '../middleware/is-valid.js';

const unitRouter = express.Router();

unitRouter.get(
  '/',
  isAuthorized,
  async (req, res) => {
    const units = await prismaClient.unit.findMany();
    return res.status(200).send(units);
  },
);

/* Create a unit */
// unitRouter.post(
//   '/',
//   isAuthorized,
//   isAdmin,
//   body('name').trim().notEmpty(),
//   body('abbreviation').trim().notEmpty(),
//   body('stepNumerator').isInt(),
//   body('stepDenominator').isInt(),
//   isValid,
//   async (req, res) => {
//     const { name, abbreviation, stepNumerator, stepDenominator } = req.body;
//
//     const unit = await prismaClient.unit.create({
//       data: {
//         name,
//         abbreviation,
//         stepNumerator,
//         stepDenominator,
//       },
//     });
//
//     return res.status(200).send(unit);
//   }
// );

export default unitRouter;
