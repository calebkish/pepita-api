import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { Subject, tap, of, switchMap, EMPTY, withLatestFrom, catchError, filter, merge, map, debounceTime } from 'rxjs';
import { requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { isPositiveNumberValidator } from 'src/app/dynamic-form/util/is-number-validator';
import { Recipe } from 'src/app/_shared/models/recipe';
import { ToastService } from 'src/app/_shared/services/toast.service';
import { wrap, Wrapped } from '../_shared/util/wrap';
import { TextInputComponent } from '../dynamic-form/components/text-input.component';
import { SelectInputComponent } from '../dynamic-form/components/select-input.component';
import { NumberInputComponent } from '../dynamic-form/components/number-input.component';
import { AutocompleteInputComponent } from '../dynamic-form/components/autocomplete-input.component';
import { SubmitButtonComponent } from '../dynamic-form/components/submit-button.component';
import { BeDirective } from '../_shared/directives/let.directive';
import { OverlayModule } from '@angular/cdk/overlay';
import { TextAreaInputComponent } from '../dynamic-form/components/text-area-input.component';
import { FoodOnRecipeCtrl, FoodOnRecipeFormArrayItem, FoodOnRecipeInputComponent } from '../food-on-recipe/food-on-recipe-input.component';
import { DirectionCtrl, RecipeDirectionsComponent } from '../recipe-directions/recipe-directions.component';
import { PutBatchRecipeInstanceRequest, RecipeService } from '../_shared/services/recipe.service';
import { FoodOnRecipeFormComponent } from "../food-on-recipe/foods-on-recipe-form.component";
import { NutrientViewModel } from '../nutrients/models/nutrient-view-model';
import { NutrientsComponent } from '../nutrients/nutrients.component';
import { DayService } from '../_shared/services/day.service';
import { ActiveDayService } from '../_shared/services/active-day.service';
import { foodOnRecipeDtoToVm } from '../food-on-recipe/util/food-on-recipe-dto-to-vm';
import { scaleFractional } from '../fractional/util/scale-fractional';
import { foodOnRecipeVmToPutDto } from '../food-on-recipe/util/food-on-recipe-vm-to-dto';
import { CoreNutrientsComponent } from "../nutrients/core-nutrients.component";
import { getScaledNutrients } from '../recipe-instance-form/recipe-instance-form.component';
import { RangeInputComponent } from '../dynamic-form/components/range-input.component';
import { recipeToNutrientViewModels } from '../food-on-recipe/util/get-food-on-recipe-nutrients';
import { aggregateNutrients } from '../nutrients/util/aggregate-nutrients';
import { calorieName } from '../nutrients/models/core-nutrients';

type BatchRecipeFormMode = 'create' | 'edit';

@Component({
  selector: 'app-batch-recipe-instance-form',
  standalone: true,
  templateUrl: './batch-recipe-instance-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxEffects, RxState],
  imports: [
    CommonModule, ReactiveFormsModule, TextInputComponent,
    SelectInputComponent, NumberInputComponent, AutocompleteInputComponent,
    RouterModule, SubmitButtonComponent, BeDirective, OverlayModule,
    FoodOnRecipeInputComponent, TextAreaInputComponent,
    RecipeDirectionsComponent, FoodOnRecipeFormComponent, NutrientsComponent,
    CoreNutrientsComponent, RangeInputComponent,
  ]
})
export class BatchRecipeInstanceFormComponent {
  fb = inject(NonNullableFormBuilder);
  recipeService = inject(RecipeService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);
  daysService = inject(DayService);
  activeDayService = inject(ActiveDayService);

  effects = inject(RxEffects);
  state: RxState<{
    putRecipeResponse: Wrapped<Recipe>,
    deleteRecipeResponse: Wrapped<void>,
    formMode: BatchRecipeFormMode,
    recipeNutrients: NutrientViewModel[],
    recipeScale: number,
    instanceGramWeight: number | undefined,
  }> = inject(RxState);

  // Actions
  onSubmit$ = new Subject<void>();
  onDeleteRecipe$ = new Subject<void>();

  form = this.fb.group<{
    name: FormControl<Recipe['name']>,
    recipeScale: FormControl<Recipe['scale']>,
    gramWeight: FormControl<Recipe['gramWeight'] | null>,
    foods?: FormArray<FoodOnRecipeCtrl>,
    directions?: FormArray<DirectionCtrl>,
  }>({
    name: this.fb.control<Recipe['name']>('', [requiredValidator]),
    recipeScale: this.fb.control<Recipe['scale']>(1, { updateOn: 'change', validators: [isPositiveNumberValidator] }),
    gramWeight: this.fb.control<Recipe['gramWeight'] | null>(null, [isPositiveNumberValidator]),
  }, { updateOn: 'blur' });

  constructor() {
    this.state.connect('formMode', this.activatedRoute.url, (_, urlSegments) => {
      return urlSegments[1].path === 'create' ? 'create' : 'edit';
    });

    this.state.connect('putRecipeResponse', this.onSubmit$.pipe(
      withLatestFrom(
        this.state.select('formMode'),
        this.activatedRoute.params,
        this.activatedRoute.queryParams,
        this.activeDayService.day$,
      ),
      switchMap(([_, formMode, params, queryParams, activeDay]) => {
        const val = this.form.getRawValue();
        if (!this.form.valid) {
          return of({ loading: false, error: 'Form is invalid' });
        }

        const req: PutBatchRecipeInstanceRequest = {
          name: val.name,
          gramWeight: val.gramWeight,
          directions: val.directions ?? [],
          foods: val.foods?.map(foodOnRecipe => foodOnRecipeVmToPutDto(foodOnRecipe)) ?? [],
          batchRecipeInstanceId: params['batchRecipeInstanceId'],
          owningBatchRecipeId: queryParams['owningBatchRecipeId'],
          mealId: queryParams['mealId'],
          recipeScale: val.recipeScale,
        };

        return this.recipeService.putBatchRecipeInstance$(req).pipe(
          wrap(),
          tap((res) => {
            if (res.loading) {
              return;
            }
            if (res.error) {
              if (formMode === 'create') {
                this.toastService.open({ message: "Failed to create batch recipe" });
                return;
              } else if (formMode === 'edit') {
                this.toastService.open({ message: "Failed to edit batch recipe" });
                return;
              }
            }
            if (res.data) {
              if (formMode === 'create') {
                // this.toastService.open({ message: `New batch recipe instance "${res.data?.name}" created` });
                this.daysService.invalidate(activeDay);
                this.router.navigate(['']);
                return;
              } else if (formMode === 'edit') {
                // this.toastService.open({ message: `Batch recipe instance "${res.data?.name}" changes saved` });
                this.daysService.invalidate(activeDay);
                this.router.navigate(['']);
                return;
              }
            }
          }),
        );
      }),
    ));

    this.state.connect('deleteRecipeResponse', this.onDeleteRecipe$.pipe(
      withLatestFrom(this.activatedRoute.params, this.activeDayService.day$),
      switchMap(([_, params, activeDay]) => {
        return this.recipeService.deleteRecipe$(params['batchRecipeInstanceId']).pipe(
          wrap(),
          tap(res => {
            if (res.data) {
              // this.toastService.open({ message: 'Batch recipe instance successfully deleted' });
              this.daysService.invalidate(activeDay);
              this.router.navigate(['']);
            } else if (res.error) {
              this.toastService.open({ message: 'Failed to delete batch recipe instance' });
            }
          })
        );
      }),
    ));
  }

  ngAfterViewInit(): void {
    const directionsFormArray = this.form.get('directions') as FormArray<DirectionCtrl> | undefined;
    const foodsFormArray = this.form.get('foods') as FormArray<FoodOnRecipeCtrl> | undefined;

    // Based on incoming recipeScale...
      // Set recipeNutrients
      // Set nutrient controls
      // Set foodsOnRecipe controls
    this.effects.register(this.form.controls.recipeScale.valueChanges.pipe(
      tap(recipeScale => {
        const foodsFormArrayItems = foodsFormArray?.getRawValue();

        const scaledNutrients = getScaledNutrients(foodsFormArrayItems!, recipeScale);
        this.state.set({ recipeNutrients: scaledNutrients });

        const foodsOnRecipe: FoodOnRecipeFormArrayItem[] = foodsFormArrayItems!
          .map((foodOnRecipe) => {
            return {
              ...foodOnRecipe,
              scaledToRecipe: scaleFractional(foodOnRecipe.scale, recipeScale),
            };
          });

        const patchValue = {
          foods: foodsOnRecipe.map(foodOnRecipe => {
            return {
              scaledToRecipe: foodOnRecipe.scaledToRecipe,
            };
          }),
        };

        this.form.patchValue(patchValue, { emitEvent: false });
      }),
    ));




    // Populate form with seed data
    this.effects.register(
      merge(
        // When in edit mode
        this.activatedRoute.params.pipe(
          map(params => params['batchRecipeInstanceId']),
        ),
        // When in create mode
        this.activatedRoute.queryParams.pipe(
          map(queryParams => queryParams['owningBatchRecipeId']),
        ),
      )
        .pipe(
          filter(recipeId => !!recipeId),
          switchMap((recipeId) => {
            return this.recipeService.getRecipe$(recipeId).pipe(
              catchError(() => {
                this.router.navigate(['recipes']);
                return EMPTY;
              }),
            );
          }),
          withLatestFrom(this.state.select('formMode')),
          tap(([recipe, formMode]) => {
            // Create directions controls & populate with bullshit data...
            if (directionsFormArray) {
              const directionsToCreate = recipe.directions.length - directionsFormArray.length;
              if (directionsToCreate > 0) {
                for (let i=0; i<directionsToCreate; i++) {
                  directionsFormArray.push(RecipeDirectionsComponent.createDirectionsControl(), { emitEvent: false });
                }
              }
            }

            // Create foods controls & populate with bullshit data...
            if (foodsFormArray) {
              const foodsToCreate = recipe.foodsOnRecipes.length - foodsFormArray.length;
              if (foodsToCreate > 0) {
                for (let i=0; i<foodsToCreate; i++) {
                  foodsFormArray.push(FoodOnRecipeInputComponent.createFoodsControl(), { emitEvent: false });
                }
              }
            }

            const foods = recipe.foodsOnRecipes
              .map((foodOnRecipe): FoodOnRecipeFormArrayItem => {
                return foodOnRecipeDtoToVm(foodOnRecipe, recipe.scale)
              });

            if (recipe.batchRecipe && recipe.batchRecipe.gramWeight) {
              this.form.controls.recipeScale.disable();

              const instancesNutrients = recipe.batchRecipe.batchRecipes
                .filter(batchRecipeInstance => batchRecipeInstance.id !== recipe.id)
                .map(batchRecipeInstance => {
                  const nutrients = recipeToNutrientViewModels(batchRecipeInstance);
                  return nutrients;
                })
                .flat();
              const agg = aggregateNutrients(instancesNutrients);

              const instanceNutrients = recipeToNutrientViewModels(recipe);
              const totaled = aggregateNutrients([...agg, ...instanceNutrients]);

              const instanceCalorieAmount = instanceNutrients.find(n => n.name === calorieName)?.amount ?? 0;
              const instancesCalorieAmount = totaled.find(n => n.name === calorieName)?.amount ?? 1;
              const ratio = instanceCalorieAmount / instancesCalorieAmount;

              const instanceGramWeight = ratio * recipe.batchRecipe.gramWeight;
              this.state.set({ instanceGramWeight });
            }

            // ...then fill controls with real data.
            this.form.patchValue({
              name: recipe.name,
              gramWeight: formMode === 'create' ? null : recipe.gramWeight,
              directions: recipe.directions,
              foods,
              recipeScale: recipe.scale,
            });
          }),
      )
    );

  }

}

