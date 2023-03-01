import { PutFoodOnRecipe } from "src/app/_shared/services/recipe.service";
import { FoodOnRecipeFormArrayItem } from "../food-on-recipe-input.component";

export function foodOnRecipeVmToPutDto(foodOnRecipe: FoodOnRecipeFormArrayItem): PutFoodOnRecipe {
  return {
    foodUnit: foodOnRecipe.foodUnit,
    food: foodOnRecipe.food,

    scaleBase: foodOnRecipe.scale.scaleBase,
    scaleNumerator: foodOnRecipe.scale.scaleNumerator,
    scaleDenominator: foodOnRecipe.scale.scaleDenominator,
    scaleDecimal: foodOnRecipe.scale.scaleDecimal,
    shouldUseScaleDecimal: foodOnRecipe.scale.shouldUseScaleDecimal,
    halves: foodOnRecipe.scale.halves,
    thirds: foodOnRecipe.scale.thirds,
    fourths: foodOnRecipe.scale.fourths,
    sixths: foodOnRecipe.scale.sixths,
    eighths: foodOnRecipe.scale.eighths,
    sixteenths: foodOnRecipe.scale.sixteenths,
  };
}
