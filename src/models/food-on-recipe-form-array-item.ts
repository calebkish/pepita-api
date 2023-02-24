import { Food, FoodsOnRecipes, FoodUnit } from "@prisma/client";
import { body } from "express-validator";
import { isNumber } from "../validators/is-number.js";
import { notEmpty } from "../validators/not-empty.js";

export interface FoodOnRecipeFormArrayItem {
  scaledToRecipe: number;
  food: Food;
  foodUnit: FoodUnit;

  scaleBase: FoodsOnRecipes['scaleBase'];
  scaleNumerator: FoodsOnRecipes['scaleNumerator'];
  scaleDenominator: FoodsOnRecipes['scaleDenominator'];
  scaleDecimal: FoodsOnRecipes['scaleDecimal'];
  shouldUseScaleDecimal: FoodsOnRecipes['shouldUseScaleDecimal'];
  halves: FoodsOnRecipes['halves'];
  thirds: FoodsOnRecipes['thirds'];
  fourths: FoodsOnRecipes['fourths'];
  sixths: FoodsOnRecipes['sixths'];
  eighths: FoodsOnRecipes['eighths'];
  sixteenths: FoodsOnRecipes['sixteenths'];
}

export const foodOnRecipeFormArrayItemValidator = [
  body('foods.*.food.id').custom(notEmpty),
  body('foods.*.foodUnit.id').custom(notEmpty),

  body('foods.*.scaleBase').custom(isNumber),
  body('foods.*.scaleNumerator').custom(isNumber),
  body('foods.*.scaleDenominator').custom(isNumber),
  body('foods.*.scaleDecimal').custom(isNumber),
  body('foods.*.shouldUseScaleDecimal').isBoolean(),
  body('foods.*.halves').isBoolean(),
  body('foods.*.thirds').isBoolean(),
  body('foods.*.fourths').isBoolean(),
  body('foods.*.sixths').isBoolean(),
  body('foods.*.sixteenths').isBoolean(),
];

