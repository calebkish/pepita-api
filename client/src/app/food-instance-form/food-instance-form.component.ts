import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TextInputComponent } from 'src/app/dynamic-form/components/text-input.component';
import { SelectInputComponent } from 'src/app/dynamic-form/components/select-input.component';
import { NumberInputComponent } from 'src/app/dynamic-form/components/number-input.component';
import { AutocompleteInputComponent } from 'src/app/dynamic-form/components/autocomplete-input.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SubmitButtonComponent } from 'src/app/dynamic-form/components/submit-button.component';
import { RxState } from '@rx-angular/state';
import { Subject, tap, of, switchMap, EMPTY, withLatestFrom, catchError, combineLatestWith } from 'rxjs';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { OverlayModule } from '@angular/cdk/overlay';
import { ToastService } from 'src/app/_shared/services/toast.service';
import { TextAreaInputComponent } from '../dynamic-form/components/text-area-input.component';
import { wrap, Wrapped } from '../_shared/util/wrap';
import { FoodOnRecipeCtrl, FoodOnRecipeInputComponent } from '../food-on-recipe/food-on-recipe-input.component';
import { rawValueChanges } from '../dynamic-form/util/raw-value-changes';
import { RxEffects } from '@rx-angular/state/effects';
import { FoodOnRecipeFormComponent } from "../food-on-recipe/foods-on-recipe-form.component";
import { RecipeDirectionsComponent } from "../recipe-directions/recipe-directions.component";
import { NutrientsComponent } from "../nutrients/nutrients.component";
import { NutrientViewModel } from '../nutrients/models/nutrient-view-model';
import { foodToNutrientViewModels } from '../food-on-recipe/util/get-food-on-recipe-nutrients';
import { FoodService, PutFoodInstanceRequest } from '../foods/services/food.service';
import { ActiveDayService } from '../_shared/services/active-day.service';
import { DayService } from '../_shared/services/day.service';
import { mockFractionalValue } from '../dynamic-form/components/fractional-input.component';
import { resolveFractional } from '../food-on-recipe/util/resolve-fractional';
import { CoreNutrientsComponent } from "../nutrients/core-nutrients.component";

type FoodFormMode = 'create' | 'edit';

@Component({
    selector: 'app-food-instance-form',
    standalone: true,
    providers: [RxState, RxEffects],
    template: `
<div *appBe="state.select() | async as vm" class="max-w-lg mx-auto p-5 pt-0">

    <div class="flex flex-col gap-3 sticky top-0 bg-white p-2 z-10 border-slate-100 border-b-2 mb-5">
      <app-core-nutrients [nutrients]="vm?.foodNutrients ?? []"/>
    </div>

    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-800 mb-5">
        {{ vm?.formMode === 'create' ? 'Create food instance': 'Edit food instance' }}
      </h1>

      <button
        *ngIf="vm?.formMode === 'edit'"
        (click)="onDeleteFood$.next()"
        class="bg-red-200 text-red-700 rounded-full px-4 py-2 text-bold text-sm active:bg-red-300 transition-all active:scale-95 w-fit flex items-center gap-1"
        type="button"
      >
        <span class="material-symbols-outlined">delete</span>
        Delete food
      </button>
    </div>

    <form (ngSubmit)="onSubmit$.next()" [formGroup]="form">
      <div class="flex flex-col gap-3">
        <app-food-on-recipe-inputs [parent]="form.controls.food" [disableCreateDelete]="true" />
      </div>

      <div class="flex">
        <app-submit-button [label]="vm?.formMode === 'create' ? 'Create' : 'Apply edit'" />
      </div>

    </form>

</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, ReactiveFormsModule, TextInputComponent,
        SelectInputComponent, NumberInputComponent, AutocompleteInputComponent,
        RouterModule, SubmitButtonComponent, BeDirective, OverlayModule,
        FoodOnRecipeInputComponent, TextAreaInputComponent,
        FoodOnRecipeFormComponent, RecipeDirectionsComponent,
        NutrientsComponent,
        CoreNutrientsComponent
    ]
})
export class FoodInstanceFormComponent {
  fb = inject(NonNullableFormBuilder);
  foodService = inject(FoodService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);
  dayService = inject(DayService);
  activeDayService = inject(ActiveDayService);

  effects = inject(RxEffects);
  state: RxState<{
    foodNutrients: NutrientViewModel[],
    putResponse: Wrapped<any>,
    formMode: FoodFormMode,
    deleteResponse: Wrapped<any>,
  }> = inject(RxState);

  // Actions
  onSubmit$ = new Subject<void>();
  onDeleteFood$ = new Subject<void>();

  form = this.fb.group<{
    food: FoodOnRecipeCtrl,
  }>({
    food: FoodOnRecipeInputComponent.createFoodsControl(),
  }, { updateOn: 'blur' });

  constructor() {
    this.state.connect('formMode', this.activatedRoute.url, (_, urlSegments) => {
      return urlSegments[1].path === 'create' ? 'create' : 'edit';
    });

    this.state.connect('putResponse', this.onSubmit$.pipe(
      withLatestFrom(
        this.state.select('formMode'),
        this.activatedRoute.queryParams,
        this.activeDayService.day$,
      ),
      switchMap(([_, formMode, queryParams, activeDay]) => {
        const val = this.form.getRawValue();
        if (!this.form.valid) {
          return of({ loading: false, error: 'Form is invalid' });
        }

        const req: PutFoodInstanceRequest = {
          foodUnitId: val.food.foodUnit!.id,
          foodId: queryParams['foodId'],
          mealId: queryParams['mealId'],
          scaleBase: val.food.scale.scaleBase,
          scaleDecimal: val.food.scale.scaleDecimal,
          scaleNumerator: val.food.scale.scaleNumerator,
          scaleDenominator: val.food.scale.scaleDenominator,
          shouldUseScaleDecimal: val.food.scale.shouldUseScaleDecimal,
          halves: val.food.scale.halves,
          thirds: val.food.scale.thirds,
          fourths: val.food.scale.fourths,
          sixths: val.food.scale.sixths,
          eighths: val.food.scale.eighths,
          sixteenths: val.food.scale.sixteenths,
        };

        return this.foodService.putFoodInstance$(req).pipe(
          wrap(),
          tap((res) => {
            if (res.loading) {
              return;
            }
            if (res.error) {
              if (formMode === 'create') {
                this.toastService.open({ message: 'Failed to create food instance' });
                return;
              } else if (formMode === 'edit') {
                this.toastService.open({ message: 'Failed to edit food instance' });
                return;
              }
            }
            if (res.data) {
              if (formMode === 'create') {
                this.toastService.open({ message: `New food instance "${res.data?.food?.name}" created` });
                this.dayService.invalidate(activeDay);
                this.router.navigate(['']);
                return;
              } else if (formMode === 'edit') {
                this.toastService.open({ message: `Food instance "${res.data?.food?.name}" changes saved` });
                this.dayService.invalidate(activeDay);
                return;
              }
            }
          }),
        );
      }),
    ));

    this.state.connect('deleteResponse', this.onDeleteFood$.pipe(
      withLatestFrom(
        this.activatedRoute.queryParams,
        this.activeDayService.day$,
      ),
      switchMap(([_, queryParams, activeDay]) => {
        const req = { foodId: queryParams['foodId'], mealId: queryParams['mealId'] };
        return this.foodService.deleteFoodInstance$(req).pipe(
          wrap(),
          tap(res => {
            if (res.data) {
              this.toastService.open({ message: 'Food instance successfully deleted' });
              this.dayService.invalidate(activeDay);
              this.router.navigate(['']);
            } else if (res.error) {
              this.toastService.open({ message: 'Failed to delete food instance' });
            }
          }),
        );
      }),
    ));


    // Populate form with seed data
    this.effects.register(this.activatedRoute.queryParams.pipe(
      combineLatestWith(this.state.select('formMode')),
      switchMap(([params, formMode]) => {
        if (formMode === 'edit') {
          return this.foodService.getFoodInstance$(params['mealId'], params['foodId']).pipe(
            tap((foodOnMeal) => {
              this.form.setValue({
                food: {
                  food: foodOnMeal.food,
                  foodUnit: foodOnMeal.foodUnit,
                  scale: {
                    scaleBase: foodOnMeal.scaleBase,
                    scaleDenominator: foodOnMeal.scaleDenominator,
                    scaleNumerator: foodOnMeal.scaleNumerator,
                    scaleDecimal: foodOnMeal.scaleDecimal,
                    shouldUseScaleDecimal: foodOnMeal.shouldUseScaleDecimal,
                    halves: foodOnMeal.halves,
                    thirds: foodOnMeal.thirds,
                    fourths: foodOnMeal.fourths,
                    sixths: foodOnMeal.sixths,
                    eighths: foodOnMeal.eighths,
                    sixteenths: foodOnMeal.sixteenths,
                  },
                  scaledToRecipe: mockFractionalValue,
                },
              });
            }),
            catchError(() => {
              this.router.navigate(['']);
              return EMPTY;
            }),
          );
        } else {
          return this.foodService.getFood$(params['foodId']).pipe(
            tap((food) => {
              this.form.setValue({
                food: {
                  food: food,
                  foodUnit: null,
                  scale: mockFractionalValue,
                  scaledToRecipe: mockFractionalValue,
                },
              });
            }),
            catchError(() => {
              this.router.navigate(['']);
              return EMPTY;
            }),
          )
        }
      }),
    ));

    this.state.connect('foodNutrients', rawValueChanges(this.form.controls.food, true), (_, foodControlValue) => {
      const { food, foodUnit, scale } = foodControlValue;
      const resolved = resolveFractional(scale);
      return foodToNutrientViewModels(food, foodUnit, resolved);
    });
  }

}
