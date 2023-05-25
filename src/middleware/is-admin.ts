import express from 'express';

export const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.locals.accountRole !== 'ADMIN') {
    res.sendStatus(403);
    return;
  }
  return next();
};
