import { FractionalValue, mockFractionalValue } from "src/app/dynamic-form/components/fractional-input.component";
import { scaleFractional } from "src/app/fractional/util/scale-fractional";
import { FoodOnRecipe } from "src/app/_shared/models/recipe";
import { FoodOnRecipeFormArrayItem } from "../food-on-recipe-input.component";

/**
  Data Transfer Object to View Model
*/
export function foodOnRecipeDtoToVm(foodOnRecipe: FoodOnRecipe, recipeScale?: number): FoodOnRecipeFormArrayItem {
  const scale: FractionalValue = {
    shouldUseScaleDecimal: foodOnRecipe.shouldUseScaleDecimal,
    scaleDenominator: foodOnRecipe.scaleDenominator,
    scaleNumerator: foodOnRecipe.scaleNumerator,
    scaleBase: foodOnRecipe.scaleBase,
    scaleDecimal: foodOnRecipe.scaleDecimal,
    halves: foodOnRecipe.halves,
    thirds: foodOnRecipe.thirds,
    fourths: foodOnRecipe.fourths,
    sixths: foodOnRecipe.sixths,
    eighths: foodOnRecipe.eighths,
    sixteenths: foodOnRecipe.sixteenths,
  };
  return {
    food: foodOnRecipe.food,
    foodUnit: foodOnRecipe.foodUnit,
    scale: scale,
    scaledToRecipe: recipeScale ? scaleFractional(scale, recipeScale) : mockFractionalValue,
  };
}

