import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TextInputComponent } from 'src/app/dynamic-form/components/text-input.component';
import { SelectInputComponent } from 'src/app/dynamic-form/components/select-input.component';
import { NumberInputComponent } from 'src/app/dynamic-form/components/number-input.component';
import { AutocompleteInputComponent } from 'src/app/dynamic-form/components/autocomplete-input.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SubmitButtonComponent } from 'src/app/dynamic-form/components/submit-button.component';
import { RxState } from '@rx-angular/state';
import { Subject, tap, of, switchMap, EMPTY, withLatestFrom, catchError, map, filter } from 'rxjs';
import { requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { OverlayModule } from '@angular/cdk/overlay';
import { isPositiveNumberValidator } from 'src/app/dynamic-form/util/is-number-validator';
import { Recipe } from 'src/app/_shared/models/recipe';
import { ToastService } from 'src/app/_shared/services/toast.service';
import { TextAreaInputComponent } from '../dynamic-form/components/text-area-input.component';
import { wrap, Wrapped } from '../_shared/util/wrap';
import { FoodOnRecipeCtrl, FoodOnRecipeInputComponent } from '../food-on-recipe/food-on-recipe-input.component';
import { PutRecipeRequest, RecipeService } from '../_shared/services/recipe.service';
import { rawValueChanges } from '../dynamic-form/util/raw-value-changes';
import { RxEffects } from '@rx-angular/state/effects';
import { FoodOnRecipeFormComponent } from "../food-on-recipe/foods-on-recipe-form.component";
import { DirectionCtrl, RecipeDirectionsComponent } from "../recipe-directions/recipe-directions.component";
import { NutrientsComponent } from "../nutrients/nutrients.component";
import { NutrientViewModel } from '../nutrients/models/nutrient-view-model';
import { getFoodOnRecipeNutrients } from '../food-on-recipe/util/get-food-on-recipe-nutrients';
import { FractionalInputComponent } from '../dynamic-form/components/fractional-input.component';
import { foodOnRecipeDtoToVm } from '../food-on-recipe/util/food-on-recipe-dto-to-vm';
import { foodOnRecipeVmToPutDto } from '../food-on-recipe/util/food-on-recipe-vm-to-dto';
import { CoreNutrientsComponent } from "../nutrients/core-nutrients.component";
import { aggregateNutrients } from '../nutrients/util/aggregate-nutrients';

type RecipeFormMode = 'create' | 'edit';

@Component({
  selector: 'app-recipe-create',
  standalone: true,
  providers: [RxState, RxEffects],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-form.component.html',
  imports: [
    CommonModule, ReactiveFormsModule, TextInputComponent,
    SelectInputComponent, NumberInputComponent, AutocompleteInputComponent,
    RouterModule, SubmitButtonComponent, BeDirective, OverlayModule,
    FoodOnRecipeInputComponent, TextAreaInputComponent,
    FoodOnRecipeFormComponent, RecipeDirectionsComponent,
    NutrientsComponent, FractionalInputComponent,
    CoreNutrientsComponent
  ],
})
export class RecipeFormComponent {
  fb = inject(NonNullableFormBuilder);
  recipeService = inject(RecipeService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);

  effects = inject(RxEffects);
  state: RxState<{
    recipeNutrients: NutrientViewModel[],
    putRecipeResponse: Wrapped<Recipe>,
    formMode: RecipeFormMode,
    deleteRecipeResponse: Wrapped<void>,
  }> = inject(RxState);

  // Actions
  onSubmit$ = new Subject<void>();
  onDeleteRecipe$ = new Subject<void>();

  form = this.fb.group<{
    name: FormControl<string>,
    gramWeight: FormControl<number | null>,
    foods?: FormArray<FoodOnRecipeCtrl>,
    directions?: FormArray<DirectionCtrl>,
  }>({
    name: this.fb.control<Recipe['name']>('', [requiredValidator]),
    gramWeight: this.fb.control<Recipe['gramWeight'] | null>(null, [isPositiveNumberValidator]),
  });

  constructor() {
    this.state.connect('formMode', this.activatedRoute.url, (_, urlSegments) => {
      return urlSegments[1].path === 'create' ? 'create' : 'edit';
    });

    this.state.connect('putRecipeResponse', this.onSubmit$.pipe(
      withLatestFrom(this.state.select('formMode'), this.activatedRoute.params),
      switchMap(([_, formMode, params]) => {
        const val = this.form.getRawValue();
        if (!this.form.valid) {
          return of({ loading: false, error: 'Form is invalid' });
        }

        const req: PutRecipeRequest = {
          name: val.name,
          gramWeight: val.gramWeight,
          directions: val.directions ?? [],
          foods: val.foods?.map(foodOnRecipe => foodOnRecipeVmToPutDto(foodOnRecipe)) ?? [],
          recipeId: params['recipeId']
        };

        return this.recipeService.putRecipe$(req).pipe(
          wrap(),
          tap((res) => {
            if (res.loading) {
              return;
            }
            if (res.error) {
              if (formMode === 'create') {
                this.toastService.open({ message: 'Failed to create recipe' });
                return;
              } else if (formMode === 'edit') {
                this.toastService.open({ message: 'Failed to edit recipe' });
                return;
              }
            }
            if (res.data) {
              if (formMode === 'create') {
                // this.toastService.open({ message: `New recipe "${res.data?.name}" created` });
                this.router.navigate(['recipes']);
                return;
              } else if (formMode === 'edit') {
                // this.toastService.open({ message: `Recipe "${res.data?.name}" changes saved` });
                this.router.navigate(['recipes']);
                return;
              }
            }
          }),
        );
      }),
    ));

    this.state.connect('deleteRecipeResponse', this.onDeleteRecipe$.pipe(
      withLatestFrom(this.activatedRoute.params),
      switchMap(([_, params]) => {
        return this.recipeService.deleteRecipe$(params['recipeId']).pipe(
          wrap(),
          tap(res => {
            if (res.data) {
              // this.toastService.open({ message: 'Recipe successfully deleted' });
              this.router.navigate(['recipes']);
            } else if (res.error) {
              this.toastService.open({ message: 'Failed to delete recipe' });
            }
          }),
        );
      }),
    ));
  }

  ngAfterViewInit(): void {
    const directionsFormArray = this.form.get('directions') as FormArray<DirectionCtrl> | undefined;
    const foodsFormArray = this.form.get('foods') as FormArray<FoodOnRecipeCtrl> | undefined;

    if (foodsFormArray) {
      this.state.connect('recipeNutrients', rawValueChanges(foodsFormArray), (_, foodsControlValues) => {
        const nutrients = foodsControlValues
          .map(f => getFoodOnRecipeNutrients(f))
          .flat()
        const agg = aggregateNutrients(nutrients);
        return agg;
      });
    }

    // Populate form with seed data
    this.effects.register(
      this.activatedRoute.params.pipe(
        map(params => params['recipeId']),
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
                  directionsFormArray.push(RecipeDirectionsComponent.createDirectionsControl());
                }
              }
            }

            if (foodsFormArray) {
              // Create foods controls & populate with bullshit data...
              const foodsToCreate = recipe.foodsOnRecipes.length - foodsFormArray.length;
              if (foodsToCreate > 0) {
                for (let i=0; i<foodsToCreate; i++) {
                  foodsFormArray.push(FoodOnRecipeInputComponent.createFoodsControl());
                }
              }
            }

            // ...then fill controls with real data.
            this.form.patchValue({
              name: recipe.name,
              gramWeight: formMode === 'create' ? null : recipe.gramWeight,
              directions: recipe.directions,
              foods: recipe.foodsOnRecipes.map(foodOnRecipe => foodOnRecipeDtoToVm(foodOnRecipe)),
            });
          }),
      ),
    );
  }

}


