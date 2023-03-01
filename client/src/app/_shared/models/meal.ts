import { FoodOnMeal } from "./food-on-meal";
import { MealTemplate } from "./meal-template";
import { Recipe } from "./recipe";

export interface Meal {
  id: string;
  created: string;
  name: string;
  saved: boolean;
  mealTemplateId: string | null;
  accountId: string;
  mealTemplate: MealTemplate;
  recipesOnMeals: RecipeOnMeal[];
  foodsOnMeals: FoodOnMeal[];
}

export interface RecipeOnMeal {
  recipe: Recipe;
  recipeId: string;
  mealId: string;
  scale: number;
}
