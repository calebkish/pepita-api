import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { FoodUnit } from "src/app/foods/services/food.service";
import { FoodOnRecipe, Recipe } from "src/app/_shared/models/recipe";
import { EnvironmentService } from "src/app/_shared/services/environment.service";
import { Meal } from "../models/meal";

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly client = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  getRecipes$(): Observable<Recipe[]> {
    return this.client.get<any[]>(`${this.env.apiHost}/recipe`);
  }

  getRecipe$(id: string): Observable<Recipe> {
    return this.client.get<any>(`${this.env.apiHost}/recipe/${id}`);
  }

  putRecipe$(body: PutRecipeRequest): Observable<Recipe> {
    return this.client.put<Recipe>(`${this.env.apiHost}/recipe`, body)
  }

  deleteRecipe$(id: string): Observable<void> {
    return this.client.delete<void>(`${this.env.apiHost}/recipe/${id}`);
  }

  putBatchRecipe$(body: PutBatchRecipeRequest): Observable<Recipe> {
    return this.client.put<Recipe>(`${this.env.apiHost}/batch-recipe`, body);
  }

  putBatchRecipeInstance$(body: PutBatchRecipeInstanceRequest) {
    return this.client.put<Recipe>(`${this.env.apiHost}/batch-recipe-instance`, body);
  }

  putRecipeInstance$(body: any) {
    return this.client.put<Recipe>(`${this.env.apiHost}/recipe-instance`, body);
  }

  copyRecipeInstance$(req: CopyRecipeInstanceRequest) {
    return this.client.post<any>(`${this.env.apiHost}/recipe/copy`, req);
  }

  search$(query: string, batched: boolean = false) {
    const params: Record<string, any> = {
      q: encodeURIComponent(query),
      batched,
    };
    return this.client.get<Recipe[]>(`${this.env.apiHost}/recipe/search`, { params });
  }

}

export type CopyRecipeInstanceRequest = {
  mealId: string;
  recipeId: string;
  targetMealId: string;
};

export interface PutFoodOnRecipe {
  food: {
    id: FoodOnRecipe['id'];
  };

  scaleBase: FoodOnRecipe['scaleBase'];
  scaleNumerator: FoodOnRecipe['scaleNumerator'];
  scaleDenominator: FoodOnRecipe['scaleNumerator'];
  scaleDecimal: FoodOnRecipe['scaleDecimal'];
  shouldUseScaleDecimal: FoodOnRecipe['shouldUseScaleDecimal'];
  halves: FoodOnRecipe['halves'];
  thirds: FoodOnRecipe['thirds'];
  fourths: FoodOnRecipe['fourths'];
  sixths: FoodOnRecipe['sixths'];
  eighths: FoodOnRecipe['eighths'];
  sixteenths: FoodOnRecipe['sixteenths'];

  foodUnit: {
    id: FoodUnit['id']
  } | null; // just doing this because we'd have this isn't null
}

export interface PutRecipeRequest {
  name: Recipe['name'];
  directions: Recipe['directions'];
  gramWeight: Recipe['gramWeight'] | null;
  foods: Array<PutFoodOnRecipe>;
  // if this exists, update this recipe using data in body
  recipeId?: Recipe['id'];
}

export interface PutBatchRecipeRequest {
  name: Recipe['name'];
  directions: Recipe['directions'];
  gramWeight: Recipe['gramWeight'] | null;
  foods: Array<PutFoodOnRecipe>;
  // if this is provided, update this batch recipe using data in body
  batchRecipeId?: Recipe['id'];
}

export interface PutBatchRecipeInstanceRequest {
  name: Recipe['name'];
  directions: Recipe['directions'];
  gramWeight: Recipe['gramWeight'] | null;
  recipeScale: Recipe['scale'];
  foods: Array<PutFoodOnRecipe>;
  // if `owningBatchRecipeId` and `mealId` is provided, create a new batch
  // recipe instance w/ this `owningBatchRecipeId` as the "owner" on meal w/ `mealId`
  owningBatchRecipeId?: Recipe['owningBatchRecipeId'];
  mealId?: Meal['id'];
  // if this is provided, update this batch recipe instance using data in body
  batchRecipeInstanceId?: Recipe['id'];
}


export interface PutRecipeInstanceRequest {
  name: Recipe['name'];
  directions: Recipe['directions'];
  gramWeight: Recipe['gramWeight'] | null;
  recipeScale: Recipe['scale'];
  foods: Array<PutFoodOnRecipe>;
  // if `mealId` is provided, create a new recipe instance on meal w/ `mealId`
  mealId?: Meal['id'];
  // if this exists, update this recipe using data in body
  recipeInstanceId?: Recipe['id'];
}
