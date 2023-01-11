import { CustomValidator } from "express-validator";

export const isNumber: CustomValidator = (value: any) => {
  return typeof value === 'number';
};
