import express from 'express';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { accountJwtSecret } from '../keys.js';

export const isAuthorized = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies.access_token;

  if (!token) {
    res.sendStatus(401);
    return;
  }
  try {
    const payload = jsonwebtoken.verify(token, accountJwtSecret) as JwtPayload;
    res.locals.accountUsername = payload.username;
    res.locals.accountId = payload.id;
    res.locals.accountRole = payload.role;
    next();
    return
  } catch {
    res.clearCookie('access_token').sendStatus(401);
    return;
  }
};
