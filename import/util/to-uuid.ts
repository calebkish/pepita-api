import crypto from 'node:crypto';

export function toUUID(val: string) {
  const hash = crypto.createHash('md5').update(val).digest('hex');
  const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
  return uuid;
}

