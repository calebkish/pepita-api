import { Meal } from "./meal";

export interface MealOnDay {
  mealId: string;
  dayId: string;
  scale: 1;
  meal: Meal;
}

