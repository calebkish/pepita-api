import { inject, Injectable } from "@angular/core";
import { RxState } from "@rx-angular/state";
import { BehaviorSubject, catchError, EMPTY, filter, Observable, switchMap, tap, throwError } from "rxjs";
import { FoodService } from "src/app/foods/services/food.service";
import { Day } from "../models/day";
import { FoodOnMeal } from "../models/food-on-meal";
import { Meal, RecipeOnMeal } from "../models/meal";
import { DayService } from "./day.service";
import { RecipeService } from "./recipe.service";
import { ToastService } from "./toast.service";

export type ItemSelection = {
  day: Day['day'];
  foodOnMeal: FoodOnMeal;
  recipeOnMeal?: never;
} | {
  day: Day['day'];
  recipeOnMeal: RecipeOnMeal;
  foodOnMeal?: never;
};

export type MealTarget = {
  day: Day['day'];
  mealId: Meal['id'];
};

@Injectable({ providedIn: 'root' })
export class ClipboardService extends RxState<any> {
  recipeService = inject(RecipeService);
  foodService = inject(FoodService);
  toastService = inject(ToastService);
  dayService = inject(DayService);

  private clipboardSubject = new BehaviorSubject<ItemSelection | null>(null);

  clipboard$ = this.clipboardSubject.asObservable();

  copy(selection: ItemSelection): void {
    this.clipboardSubject.next(selection);
  }

  clear(): void {
    this.clipboardSubject.next(null);
  }

  paste$(target: MealTarget): Observable<any> {
    return this.clipboardSubject.pipe(
      filter((v): v is ItemSelection => v !== null),
      switchMap((clipboard) => {
        if (clipboard.recipeOnMeal) {
          return this.recipeService.copyRecipeInstance$({
            mealId: clipboard.recipeOnMeal.mealId,
            recipeId: clipboard.recipeOnMeal.recipeId,
            targetMealId: target.mealId,
          });
        } else if (clipboard.foodOnMeal) {
          return this.foodService.copyFoodInstance$({
            mealId: clipboard.foodOnMeal.mealId,
            foodId: clipboard.foodOnMeal.foodId,
            targetMealId: target.mealId,
          });
        } else {
          return throwError(() => new Error('Nothing in the clipboard'));
        }
      }),
      tap(() => {
        this.dayService.invalidate(target.day);
        this.toastService.open({ message: 'Copy successful' });
      }),
      catchError(() => {
        this.toastService.open({ message: 'Failed to copy item' });
        return EMPTY;
      }),
    );
  }
}
