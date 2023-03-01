import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { Subject, tap, of, switchMap, EMPTY, withLatestFrom, catchError, filter, merge, map } from 'rxjs';
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
import { FoodOnRecipeCtrl, FoodOnRecipeInputComponent } from '../food-on-recipe/food-on-recipe-input.component';
import { DirectionCtrl, RecipeDirectionsComponent } from '../recipe-directions/recipe-directions.component';
import { PutBatchRecipeRequest, RecipeService } from '../_shared/services/recipe.service';
import { FoodOnRecipeFormComponent } from "../food-on-recipe/foods-on-recipe-form.component";
import { foodOnRecipeVmToPutDto } from '../food-on-recipe/util/food-on-recipe-vm-to-dto';
import { foodOnRecipeDtoToVm } from '../food-on-recipe/util/food-on-recipe-dto-to-vm';


type BatchRecipeFormMode = 'create' | 'edit';

@Component({
    selector: 'app-batch-recipe-form',
    standalone: true,
    templateUrl: './batch-recipe-form.component.html',
    providers: [RxState, RxEffects],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, ReactiveFormsModule, TextInputComponent,
        SelectInputComponent, NumberInputComponent, AutocompleteInputComponent,
        RouterModule, SubmitButtonComponent, BeDirective, OverlayModule,
        FoodOnRecipeInputComponent, TextAreaInputComponent,
        RecipeDirectionsComponent,
        FoodOnRecipeFormComponent
    ]
})
export class BatchRecipeFormComponent {
  fb = inject(NonNullableFormBuilder);
  recipeService = inject(RecipeService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);
  effects = inject(RxEffects);
  state: RxState<{
    postRecipeResponse: Wrapped<Recipe>,
    deleteRecipeResponse: Wrapped<void>,
    formMode: BatchRecipeFormMode,
  }> = inject(RxState);

  // Actions
  onSubmit$ = new Subject<void>();
  onDeleteRecipe$ = new Subject<void>();

  form = this.fb.group<{
    name: FormControl<Recipe['name']>,
    gramWeight: FormControl<Recipe['gramWeight'] | null>,
    foods?: FormArray<FoodOnRecipeCtrl>,
    directions?: FormArray<DirectionCtrl>,
  }>({
    name: this.fb.control<Recipe['name']>('', [requiredValidator]),
    gramWeight: this.fb.control<Recipe['gramWeight'] | null>(null, [isPositiveNumberValidator]),
  }, { updateOn: 'blur' });

  constructor() {
    this.state.connect('formMode', this.activatedRoute.url, (_, urlSegments) => {
      return urlSegments[1].path === 'create' ? 'create' : 'edit';
    });

    this.state.connect('postRecipeResponse', this.onSubmit$.pipe(
      withLatestFrom(this.state.select('formMode'), this.activatedRoute.params),
      switchMap(([_, formMode, params]) => {
        const val = this.form.getRawValue();
        if (!this.form.valid) {
          return of({ loading: false, error: 'Form is invalid' });
        }

        const req: PutBatchRecipeRequest = {
          name: val.name,
          gramWeight: val.gramWeight,
          directions: val.directions ?? [],
          foods: val.foods?.map(foodOnRecipe => foodOnRecipeVmToPutDto(foodOnRecipe)) ?? [],
          batchRecipeId: params['batchRecipeId']
        };

        return this.recipeService.putBatchRecipe$(req).pipe(
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
                this.toastService.open({ message: `New batch recipe "${res.data?.name}" created` });
                this.router.navigate(['recipes']);
                return;
              } else if (formMode === 'edit') {
                this.toastService.open({ message: `Batch recipe "${res.data?.name}" changes saved` });
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
        return this.recipeService.deleteRecipe$(params['batchRecipeId']).pipe(
          wrap(),
          tap(res => {
            if (res.data) {
              this.toastService.open({ message: 'Batch recipe successfully deleted' });
              this.router.navigate(['recipes']);
            } else if (res.error) {
              this.toastService.open({ message: 'Failed to delete batch recipe' });
            }
          })
        );
      }),
    ));
  }

  ngAfterViewInit(): void {
    const directionsFormArray = this.form.get('directions') as FormArray<DirectionCtrl> | undefined;
    const foodsFormArray = this.form.get('foods') as FormArray<FoodOnRecipeCtrl> | undefined;

    // Populate form with seed data
    this.effects.register(
      merge(
        // When in edit mode
        this.activatedRoute.params.pipe(
          map(params => params['batchRecipeId']),
        ),
        // When in create mode
        this.activatedRoute.queryParams.pipe(
          map(queryParams => queryParams['recipeId']),
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
                  directionsFormArray.push(RecipeDirectionsComponent.createDirectionsControl());
                }
              }
            }

            // Create foods controls & populate with bullshit data...
            if (foodsFormArray) {
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
      )
    );

  }

}
