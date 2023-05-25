import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { FractionalValue } from "src/app/dynamic-form/components/fractional-input.component";
import { FoodOnMeal } from "src/app/_shared/models/food-on-meal";
import { Meal } from "src/app/_shared/models/meal";
import { Recipe } from "src/app/_shared/models/recipe";
import { EnvironmentService } from "src/app/_shared/services/environment.service";

@Injectable({ providedIn: 'root' })
export class FoodService {
  private readonly client = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  getFoods$(): Observable<Food[]> {
    return this.client.get<Food[]>(`${this.env.apiHost}/food`);
  }

  getFood$(foodId: string): Observable<Food> {
    return this.client.get<Food>(`${this.env.apiHost}/food/${foodId}`);
  }

  getFoodCategories$(): Observable<FoodCategory[]> {
    return this.client.get<FoodCategory[]>(`${this.env.apiHost}/categories`);
  }

  search$(query: string, brandId?: FoodBrand['id']): Observable<Food[]> {
    const params: Record<string, any> = {
      q: encodeURIComponent(query),
      ...(brandId ? { brandId: encodeURIComponent(brandId) } : {}),
    };

    return this.client.get<Food[]>(`${this.env.apiHost}/food/search`, { params });
  }

  getFoodInstance$(mealId: string, foodId: string): Observable<FoodOnMeal> {
    return this.client.get<FoodOnMeal>(`${this.env.apiHost}/food-instance`, {
      params: {
        mealId,
        foodId,
      },
    });
  }

  putFoodInstance$(req: PutFoodInstanceRequest): Observable<FoodOnMeal> {
    return this.client.put<FoodOnMeal>(`${this.env.apiHost}/food-instance`, req);
  }

  deleteFoodInstance$(req: DeleteFoodInstanceRequest) {
    return this.client.delete<any>(`${this.env.apiHost}/food-instance`, {
      body: req,
    });
  }

  copyFoodInstance$(req: CopyFoodInstanceRequest) {
    return this.client.post<any>(`${this.env.apiHost}/food-instance/copy`, req);
  }
}

export type FoodBrand = {
  id: string;
  name: string;
};

export type CopyFoodInstanceRequest = {
  mealId: string;
  foodId: string;
  targetMealId: string;
};

export type PutFoodInstanceRequest = {
  // if `foodId`+`mealId` combination already exists in DB, this will be an update
  foodId: Food['id'];
  mealId: Meal['id'];
  foodUnitId: FoodUnit['id'];
} & FractionalValue;

export interface DeleteFoodInstanceRequest {
  foodId: Food['id'];
  mealId: Meal['id'];
}

export interface FoodCategory {
  id: string;
  name: string;
}

export interface Food {
  id: string;
  created: string;
  name: string;
  source: string;
  usdaDataType: string;
  fdcId: number;
  foodCategoryId: string | null;
  accountId: string | null;
  foodUnits: FoodUnit[];
  nutrientsOnFoods: NutrientOnFood[];

  baseUnitAmount: number;
  baseUnit: string;
  foodBrandId?: FoodBrand['id'];
  foodBrand?: FoodBrand;
}


export interface FoodUnit {
  id: string;
  created: string;
  name: string;
  abbreviation: string;
  servingSizeAmount: number;
  halves: boolean;
  thirds: boolean;
  fourths: boolean;
  sixths: boolean;
  eighths: boolean;
  sixteenths: boolean;
  // unitToGramRatio: number;
  // gramWeight: number;
  baseUnitAmountRatio: number;
  foodUnitAmount: number;
  foodId: string;
  unitId: string | null;
}

export interface NutrientOnFood {
  nutrientId: string;
  foodId: string;
  amount: number;
  unitId: string;
  nutrient: Nutrient;
  unit: Unit;
}

export interface Nutrient {
  id: string;
  name: string;
  fdcNutrientId: number;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;

  halves: boolean;
  thirds: boolean;
  fourths: boolean;
  sixths: boolean;
  eighths: boolean;
  sixteenths: boolean;
}
