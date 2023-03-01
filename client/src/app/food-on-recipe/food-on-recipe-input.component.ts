import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup  } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { NumberInputComponent } from 'src/app/dynamic-form/components/number-input.component';
import { Food, FoodUnit } from 'src/app/foods/services/food.service';
import { ConnectionPositionPair, OverlayModule } from '@angular/cdk/overlay';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { AutocompleteInputComponent } from '../dynamic-form/components/autocomplete-input.component';
import { SelectInputComponent, SelectOption } from '../dynamic-form/components/select-input.component';
import { rawValueChanges } from '../dynamic-form/util/raw-value-changes';
import { NutrientViewModel } from '../nutrients/models/nutrient-view-model';
import { getFoodOnRecipeNutrients } from './util/get-food-on-recipe-nutrients';
import { sortNutrients } from '../nutrients/util/sort-nutrients';
import { requiredValidator } from "src/app/dynamic-form/util/has-gram-validator";
import { FoodOnRecipe } from "src/app/_shared/models/recipe";
import { RxEffects } from '@rx-angular/state/effects';
import { FractionalInputComponent, FractionalValue, mockFractionalValue } from '../dynamic-form/components/fractional-input.component';

// The source of truth
export interface FoodOnRecipeFormArrayItem {
  food: FoodOnRecipe['food'];
  foodUnit: FoodOnRecipe['foodUnit'] | null;
  scaledToRecipe: FractionalValue; // only needed for recipe instances or batch recipe instances
  scale: FractionalValue;
}

export type FoodOnRecipeCtrl = ReturnType<typeof FoodOnRecipeInputComponent.createFoodsControl>;

@Component({
  selector: 'app-food-on-recipe-inputs',
  standalone: true,
  template: `
<ng-container [formGroup]="parent" *appBe="state.select() | async as vm">
  <div
    class="gap-3 items-center w-full flex justify-between"
    cdkOverlayOrigin
    #trigger="cdkOverlayOrigin"
  >
    <p
      class="text-sm [max-width:15rem]"
      (mouseenter)="state.set({ shouldOpenOverlay: true })"
      (mouseleave)="state.set({ shouldOpenOverlay: false })"
    >
      {{ vm?.name ?? '' }}
    </p>

    <div class="flex flex-row items-center gap-2">
      <app-fractional-input
        *ngIf="showScaledToRecipe"
        formControlName="scaledToRecipe"
        label="Scaled"
        class="[max-width:10rem]"
        [disableScaleChanging]="disableScaleChanging"
      />

      <app-fractional-input
        formControlName="scale"
        label="Amount"
        class="[max-width:10rem]"
        [disableScaleChanging]="disableScaleChanging"
      />

      <app-select-input
        class="[max-width:10rem]"
        label="Unit"
        formCtrlName="foodUnit"
        [options]="vm?.foodUnitOptions ?? []"
        [customError]="vm?.customError?.foodUnit"
      />

      <button
        *ngIf="!disableCreateDelete"
        (click)="onFoodRemove.emit()"
        title="Delete serving unit"
        class="bg-red-200 text-red-700 block rounded-full px-3 py-0 pb-1 text-bold text-3xl active:bg-red-300 transition-all active:scale-95"
        type="button"
      >
        -
      </button>
    </div>

  </div>

  <ng-template
    cdkConnectedOverlay
    [cdkConnectedOverlayOrigin]="trigger"
    [cdkConnectedOverlayOpen]="!!vm?.shouldOpenOverlay"
    [cdkConnectedOverlayLockPosition]="false"
    [cdkConnectedOverlayPositions]="positionPairs"
    [cdkConnectedOverlayPush]="true"
  >
    <div *ngIf="vm?.nutrientsVm?.length" class="max-w-xs mx-auto sticky top-0 gap-1 grid [grid-template-columns:1fr_min-content_min-content] bg-slate-900/80 rounded-lg ml-4 p-4 backdrop-blur-sm">
      <ng-container *ngFor="let nutrient of vm?.nutrientsVm ?? []">
        <div class="text-sm text-slate-100">{{ nutrient.name }}</div>
        <div class="text-slate-50 justify-self-end">{{ nutrient.amount | number:'1.1-1' }}</div>
        <div class="text-sm text-slate-300 self-end">{{ nutrient.unit }}</div>
      </ng-container>
    </div>
  </ng-template>
</ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NumberInputComponent, AutocompleteInputComponent,
    SelectInputComponent, OverlayModule, BeDirective, ReactiveFormsModule, FractionalInputComponent],
  providers: [RxState, RxEffects],
})
export class FoodOnRecipeInputComponent implements OnInit {
  static createFoodsControl(
    input?: Partial<FoodOnRecipeFormArrayItem>
  ) {
    const newGroup = new FormGroup({
      food: new FormControl<FoodOnRecipeFormArrayItem['food']>(
        input?.food ?? mockFood,
        {
          nonNullable: true,
          validators: [requiredValidator],
        },
      ),
      foodUnit: new FormControl<FoodOnRecipeFormArrayItem['foodUnit']>(
        input?.foodUnit ?? null,
        {
          nonNullable: true,
          validators: [requiredValidator],
          updateOn: 'change'
        },
      ),
      scale: new FormControl<FoodOnRecipeFormArrayItem['scale']>(
        input?.scale ?? mockFractionalValue,
        {
          nonNullable: true,
          // updateOn: 'blur',
        },
      ),
      scaledToRecipe: new FormControl<FoodOnRecipeFormArrayItem['scaledToRecipe']>(
        input?.scaledToRecipe ?? mockFractionalValue,
        {
          nonNullable: true,
          // updateOn: 'blur',
        },
      ),
    }) satisfies FormGroup<Record<keyof FoodOnRecipeFormArrayItem, any>>;

    return newGroup;
  }

  effects = inject(RxEffects);
  state: RxState<{
    customError: Record<keyof ReturnType<FoodOnRecipeCtrl['getRawValue']>, string | undefined>,
    shouldOpenOverlay: boolean,
    nutrientsVm: NutrientViewModel[],
    foodUnitOptions: SelectOption<FoodUnit>[],
    name: string,
  }> = inject(RxState);

  @Input() set customError(customError: Record<keyof ReturnType<FoodOnRecipeCtrl['getRawValue']>, string | undefined>) {
    this.state.set({ customError });
  }
  @Input() parent!: FoodOnRecipeCtrl;
  @Input() showScaledToRecipe = false;
  @Input() disableBaseInputs = false;
  @Input() disableScaleChanging = false;
  @Input() disableCreateDelete = false;

  @Output() onFoodRemove = new EventEmitter<void>();

  positionPairs: ConnectionPositionPair[] = [{ offsetX: 0, offsetY: 0, originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' }];

  ngOnInit(): void {
    if (this.disableBaseInputs) {
      this.parent.get('scale')?.disable();
      this.parent.get('foodUnit')?.disable();
    }

    this.state.connect(rawValueChanges(this.parent, true), (_, value) => {
      return {
        name: value.food.name,
        foodUnitOptions: value.food.foodUnits
          .map(foodUnit => ({
            name: `${foodUnit.servingSizeAmount} ${foodUnit.abbreviation}`,
            value: foodUnit,
          })),
      };
    });

    this.state.connect('nutrientsVm', rawValueChanges(this.parent, true), (_, value: FoodOnRecipeFormArrayItem) => {
      return getFoodOnRecipeNutrients(value).sort(sortNutrients);
    });

  }

}

export const mockFood: Food = {
  id: '',
  created: '',
  name: '',
  baseUnitAmount: 0,
  baseUnit: 'g',
  foodBrandId: '',
  foodBrand: {
    id: '',
    name: ''
  },
  source: '',
  usdaDataType: '',
  fdcId: 0,
  foodCategoryId: '',
  accountId: null,
  foodUnits: [],
  nutrientsOnFoods: [],
};
