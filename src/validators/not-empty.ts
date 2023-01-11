import { CustomValidator } from "express-validator";

export const notEmpty: CustomValidator = (value: any) => {
  return typeof value === 'string' && value.trim() !== '';
}
