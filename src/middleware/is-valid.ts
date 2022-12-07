import express from 'express';
import { validationResult } from 'express-validator';

export const isValid = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  console.log(errors.mapped());
  console.log(errors.array());
  const extractedErrors = Object.fromEntries(errors.array().map((err) => {
   return [err.param, err.msg] as const;
  }));

  return res.status(422).send({
    errors: extractedErrors,
  });
}
