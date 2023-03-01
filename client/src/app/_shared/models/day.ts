import { MealOnDay } from "./meal-on-day";

export interface Day {
  id: string;
  day: string;
  weight: number | null;
  waist: number | null;
  neck: number | null;
  accountId: string;
  // foodsOnDays: any[];
  // recipesOnDays: any[];
  mealsOnDays: MealOnDay[];
}
