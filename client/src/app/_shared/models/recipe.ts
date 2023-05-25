import { Food, FoodUnit } from "src/app/foods/services/food.service";

export interface Recipe {
  id: string;
  created: string;
  name: string;
  saved: boolean;
  owningBatchRecipeId: string | null;
  gramWeight: number;
  isBatchRecipe: boolean;
  isBatchRecipeCooked: boolean | null;
  isBatchRecipeEaten: boolean | null;
  directions: string[];
  accountId: string;
  foodsOnRecipes: FoodOnRecipe[];
  scale: number;
  batchRecipes: Recipe[];
  batchRecipe?: Recipe;
}

export interface FoodOnRecipe {
  id: string;
  foodId: string;
  note: string | null;
  foodUnitId: string;
  food: Food;
  foodUnit: FoodUnit;
  recipeId: string;

  scaleBase: number;
  scaleNumerator: number;
  scaleDenominator: number;
  scaleDecimal: number;
  shouldUseScaleDecimal: boolean;
  halves: boolean;
  thirds: boolean;
  fourths: boolean;
  sixths: boolean;
  eighths: boolean;
  sixteenths: boolean;
}
