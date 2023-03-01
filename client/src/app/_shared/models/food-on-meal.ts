import { FractionalValue } from "src/app/dynamic-form/components/fractional-input.component";
import { Food, FoodUnit } from "src/app/foods/services/food.service";
import { Meal } from "./meal";

export type FoodOnMeal = {
  food: Food;
  foodId: string;
  // meal: Meal;
  mealId: string;
  foodUnit: FoodUnit;
  foodUnitId: string;
} & FractionalValue;


// export function isFoodOnMeal() {
//
// }
