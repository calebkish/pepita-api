import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ToastService } from '../services/toast.service';
import { RxEffects } from '@rx-angular/state/effects';
import { Food, FoodService } from 'src/app/foods/services/food.service';
import { TextInputComponent } from 'src/app/dynamic-form/components/text-input.component';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap, BehaviorSubject, EMPTY } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { BeDirective } from '../directives/let.directive';
import { BreakpointObserver } from '@angular/cdk/layout';
import { GlobalPositionStrategy } from '@angular/cdk/overlay';
import { Recipe } from '../models/recipe';
import { RecipeService } from '../services/recipe.service';
import { wrap, Wrapped } from '../util/wrap';
import { rawValueChanges } from 'src/app/dynamic-form/util/raw-value-changes';
import { calorieName, proteinName } from 'src/app/nutrients/models/core-nutrients';

export type EntityType = AddEntityDialogResult['type'];

export interface AddEntityDialogData {
  entitiesToShow?: EntityType[];
}

export type AddEntityDialogResult = {
  type: 'food',
  item: Food
} | {
  type: 'recipe',
  item: Recipe
} | {
  type: 'batchRecipe',
  item: Recipe
};

type DialogTab = 'food' | 'recipe' | 'batchRecipe';

@Component({
  selector: 'app-add-entity-dialog',
  standalone: true,
  template: `
<div *appBe="state.select() | async as vm" class="h-full">
  <div cdkTrapFocus class="bg-white sm:rounded-xl rounded-t-xl p-5 flex flex-col gap-3 h-full">
    <app-text-input
      class="block [height:44px]"
      [showLabel]="false"
      label="Search"
      [ctrl]="searchControl"
      placeholder="Search..."
    />

    <div *ngIf="(vm?.tabsToShow?.length ?? 0) > 1" class="flex gap-5">
      <button
        type="button"
        *ngIf="vm?.tabsToShow?.includes('food')"
        class="p-1 border-b-2"
        [class]="{
          'border-slate-500': vm?.activeTab === 'food'
        }"
        (click)="setActiveDialogTab$.next('food')"
      >Foods</button>
      <button
        type="button"
        *ngIf="vm?.tabsToShow?.includes('recipe')"
        class="p-1 border-b-2"
        [class]="{
          'border-slate-500': vm?.activeTab === 'recipe'
        }"
        (click)="setActiveDialogTab$.next('recipe')"
      >Recipes</button>
    </div>

    <div
      *ngIf="
        vm?.activeTab === 'food' &&
        vm?.tabsToShow?.includes('food') &&
        vm?.foodsQueried?.data?.length
      "
      class="flex flex-col overflow-y-auto"
    >
      <div class="flex flex-col gap-3 overflow-y-auto">
        <button
          *ngFor="let food of vm?.foodsQueried?.data ?? []"
          type="button"
          (click)="onResultSelect({ type: 'food', item: food })"
          class="p-3 active:bg-slate-300 w-full text-left text-sm bg-slate-100 rounded-md hover:bg-slate-200"
        >
          <div class="flex justify-between gap-3">
            <div>
              <p class="">{{ food.name }}</p>
              <p class="text-xs" *ngIf="food.foodBrand?.name as foodBrandName">{{foodBrandName}}</p>
              <p class="text-xs">{{getFoodUnitName(food)}}</p>
            </div>

            <div class="w-max shrink-0">
              <p class="text-xs" *ngIf="getCalories(food) as calories">{{calories | number:'1.0-0'}} kcal</p>
              <p class="text-xs" *ngIf="getProtein(food) as protein">Protein: {{protein | number:'1.0-0'}} g</p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div
      *ngIf="
        vm?.activeTab === 'recipe' &&
        vm?.tabsToShow?.includes('recipe') &&
        vm?.recipesQueried?.data?.length
      "
      class="flex flex-col overflow-y-auto"
    >
      <div class="flex flex-col gap-3 overflow-y-auto">
        <button
          *ngFor="let recipe of vm?.recipesQueried?.data ?? []"
          type="button"
          (click)="onResultSelect(recipe.isBatchRecipe ? { type: 'batchRecipe', item: recipe } : { type: 'recipe', item: recipe })"
          class="p-3 active:bg-slate-300 w-full text-left text-sm bg-slate-100 rounded-md hover:bg-slate-200"
        >
          <p class="">{{ recipe.name }}</p>
          <p class="text-xs" *ngIf="recipe.isBatchRecipe">Batched</p>
        </button>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    :host {
      height: 100%;
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState, RxEffects],
  imports: [CommonModule, TextInputComponent, A11yModule, BeDirective],
})
export class AddEntityDialogComponent {

  fb = inject(NonNullableFormBuilder);
  dialogRef: DialogRef<AddEntityDialogResult, AddEntityDialogComponent> = inject(DialogRef);
  dialogData: AddEntityDialogData = inject(DIALOG_DATA);
  toastService = inject(ToastService);
  foodService = inject(FoodService);
  recipeServce = inject(RecipeService);
  breakpointObserver = inject(BreakpointObserver);

  effects = inject(RxEffects);
  state: RxState<{
    isFoodSearchOpen: boolean,
    foodsQueried: Wrapped<Food[]>,
    recipesQueried: Wrapped<Recipe[]>,
    activeTab: DialogTab,
    tabsToShow: EntityType[],
  }> = inject(RxState);

  searchControl = this.fb.control('');

  @ViewChild(TextInputComponent) searchInput!: TextInputComponent;

  setActiveDialogTab$ = new BehaviorSubject<DialogTab>('food');

  constructor() {
    this.searchControl
    this.state.set({
      tabsToShow: this.dialogData.entitiesToShow ?? ['food', 'recipe'],
    });

    this.state.connect('activeTab', this.setActiveDialogTab$);

    const tailwindLessThanSm = '(max-width: 640px)';
    const tailwindSm = '(min-width: 640px)';

    this.effects.register(this.breakpointObserver
      .observe([tailwindLessThanSm, tailwindSm])
      .pipe(
        tap(result => {
          const activeMediaQuery = Object.entries(result.breakpoints)
            .find(([_, isActive]) => isActive)?.[0];

          if (activeMediaQuery && activeMediaQuery === tailwindLessThanSm) {
            this.dialogRef.updateSize('100vw', '90vh');
            const posStrat = new GlobalPositionStrategy()
              .bottom('0');
            this.dialogRef.overlayRef.updatePositionStrategy(posStrat);
            this.dialogRef.updatePosition();
          } else {
            this.dialogRef.updateSize('50vw', '80vh');
            const posStrat = new GlobalPositionStrategy()
              .centerHorizontally()
              .centerVertically();
            this.dialogRef.overlayRef.updatePositionStrategy(posStrat);
            this.dialogRef.updatePosition();
          }
        }),
      ),
    );

    this.state.connect('foodsQueried', this.state.select('activeTab').pipe(
      switchMap(activeTab => activeTab === 'food' ? rawValueChanges(this.searchControl, true) : EMPTY),
      debounceTime(400),
      distinctUntilChanged(),
      filter(name => !!name),
      switchMap(name => {
        return this.foodService.search$(name);
      }),
      wrap(),
    ));

    this.state.connect('recipesQueried', this.state.select('activeTab').pipe(
      switchMap(activeTab => activeTab === 'recipe' ? rawValueChanges(this.searchControl, true) : EMPTY),
      debounceTime(400),
      distinctUntilChanged(),
      filter(name => !!name),
      switchMap(name => {
        return this.recipeServce.search$(name);
      }),
      wrap(),
    ));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // Doesn't work outside the setTimeout
      this.searchInput.focus();
    }, 0);
  }

  protected onResultSelect(result: AddEntityDialogResult): void {
    this.dialogRef.close(result);
  }

  protected getCalories(food: Food) {
    const brandedFoodUnit = food.foodUnits.find(foodUnit => foodUnit.abbreviation === 'serv');
    const calories = food.nutrientsOnFoods.find(n => n.nutrient.name === calorieName)?.amount;
    if (brandedFoodUnit && calories) {
      return brandedFoodUnit.baseUnitAmountRatio * calories;
    }
    return calories;
  }

  protected getProtein(food: Food) {
    const brandedFoodUnit = food.foodUnits.find(foodUnit => foodUnit.abbreviation === 'serv');
    const protein = food.nutrientsOnFoods.find(n => n.nutrient.name === proteinName)?.amount;
    if (brandedFoodUnit && protein) {
      return brandedFoodUnit.baseUnitAmountRatio * protein;
    }
    return protein;
  }

  protected getFoodUnitName(food: Food) {
    const brandedFoodUnit = food.foodUnits.find(foodUnit => foodUnit.abbreviation === 'serv');
    const pattern = /serving \((?<unitName>.*)\)/;
    if (brandedFoodUnit?.name) {
      const match = brandedFoodUnit?.name.match(pattern);
      const unitName = match?.groups?.['unitName'];
      return unitName ?? '';
    }
    return '';
  }

}
