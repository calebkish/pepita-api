import { Account } from '@prisma/client';
import jsonwebtoken from 'jsonwebtoken';
import { accountJwtSecret } from '../keys.js';

export async function createAccountJwt(account: Account): Promise<string> {
  const payload = {
    id: account.id,
    email: account.email,
    role: account.role,
  };

  const expiresIn = 60 * 60 * 24 * 7 * 2; // 2 weeks

  return new Promise((resolve, reject) => {
    jsonwebtoken.sign(payload, accountJwtSecret, { expiresIn }, (err, token) => {
      if (err || token === undefined) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}

