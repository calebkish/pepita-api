import { Food, FoodUnit } from "src/app/foods/services/food.service";
import { NutrientViewModel } from "src/app/nutrients/models/nutrient-view-model";
import { aggregateNutrients } from "src/app/nutrients/util/aggregate-nutrients";
import { Recipe } from "src/app/_shared/models/recipe";
import { FoodOnRecipeFormArrayItem } from "../food-on-recipe-input.component";
import { foodOnRecipeDtoToVm } from "./food-on-recipe-dto-to-vm";
import { resolveFractional } from "./resolve-fractional";

export function getFoodOnRecipeNutrients(
  foodOnRecipe: FoodOnRecipeFormArrayItem,
  // If `true`, we assume that `foodOnRecipe.scaledToRecipe` is properly scaled
  useScaledToRecipe: boolean = false,
): NutrientViewModel[] {
  const scale = useScaledToRecipe
    ? resolveFractional(foodOnRecipe.scaledToRecipe)
    : resolveFractional(foodOnRecipe.scale);
  const { foodUnit, food } = foodOnRecipe;
  return foodToNutrientViewModels(food, foodUnit, scale);
}

export function foodToNutrientViewModels(
  food: Food,
  foodUnit: FoodUnit | null,
  scale: number,
): NutrientViewModel[] {
  if (!foodUnit) return [];

  return food.nutrientsOnFoods
    .map(({ nutrient, unit, amount }) => ({
      name: nutrient.name,
      nutrientId: nutrient.id,
      unit: unit.abbreviation,
      amount: amount * foodUnit.baseUnitAmountRatio * scale,
    }));
}

export function recipeToNutrientViewModels(
  recipe: Recipe,
) {
  const recipeNutrients = recipe.foodsOnRecipes.map(foodOnRecipe => {
    const vm = foodOnRecipeDtoToVm(foodOnRecipe, recipe.scale);
    return getFoodOnRecipeNutrients(vm, true);
  })
  .flat();

  return aggregateNutrients(recipeNutrients);
}

