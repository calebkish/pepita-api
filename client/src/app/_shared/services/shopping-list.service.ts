import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Food, FoodUnit } from "src/app/foods/services/food.service";
import { Recipe } from "../models/recipe";
import { EnvironmentService } from "./environment.service";

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private readonly client = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  getShopppingLists$(): Observable<ShoppingList[]> {
    return this.client.get<ShoppingList[]>(`${this.env.apiHost}/shopping-list`);
  }

  getShoppingList$(shoppingListId: string): Observable<ShoppingListRes> {
    return this.client.get<ShoppingListRes>(`${this.env.apiHost}/shopping-list/${shoppingListId}`);
  }

  putShoppingList$(req: PutShoppingListRequest): Observable<ShoppingList> {
    return this.client.put<ShoppingList>(`${this.env.apiHost}/shopping-list`, req);
  }

  deleteShoppingList$(shoppingListId: string): Observable<ShoppingListRes> {
    return this.client.delete<ShoppingListRes>(`${this.env.apiHost}/shopping-list/${shoppingListId}`);
  }

  getStores$(): Observable<Store[]> {
    return this.client.get<any>(`${this.env.apiHost}/store`);
  }

  getStore$(storeId: Store['id']): Observable<Store> {
    return this.client.get<any>(`${this.env.apiHost}/store/${storeId}`);
  }

  putStore$(req: PutStoreRequest): Observable<any> {
    return this.client.put<any>(`${this.env.apiHost}/store`, req);
  }

  deleteStore$(storeId: string): Observable<any> {
    return this.client.delete<any>(`${this.env.apiHost}/store/${storeId}`);
  }
}

export type ShoppingList = {
  id: string;
  name: string;
  startDay: string;
  endDay: string;
  accountId: string;
  purchasedFoodsIds: string[];
}

export type ShoppingListRes = {
  shoppingList: ShoppingList,
  itemsGroupedByFoods: Record<string, FoodListItem[]>;
  itemsGroupedByFoodsReducedByUnits: Record<string, FoodListItem[]>;
}

export type PutShoppingListRequest = {
  startDay: ShoppingList['startDay'];
  endDay: ShoppingList['endDay'];
  purchasedFoodsIds: ShoppingList['purchasedFoodsIds'];
  shoppingListId?: ShoppingList['id'];
}

export type PutStoreRequest = {
  name: Store['name'];
  locations: string[];
  storeId: Store['id'];
}

export type Store = {
  id: string;
  name: string;
  accountId: string;
  locations: StoreLocation[];
}

export type StoreLocation = {
  id: string;
  name: string;
  storeId: string;
  accountId: string;
}


export type FoodListItem = {
  amount: number;
  grams: number;
  food: {
    id: Food['id'];
    name: Food['name'];
  },
  foodUnit: {
    id: FoodUnit['id'];
    name: FoodUnit['name'];
  },
  associatedRecipe?: {
    id: Recipe['id'];
    name: Recipe['name'];
  }
};
