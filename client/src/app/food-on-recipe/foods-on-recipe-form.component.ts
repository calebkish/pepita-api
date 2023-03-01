import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodOnRecipeCtrl, FoodOnRecipeInputComponent } from "./food-on-recipe-input.component";
import { map, Subject, tap } from 'rxjs';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { trackByIndex } from '../_shared/util/track-by-index';
import { rawValueChanges } from '../dynamic-form/util/raw-value-changes';
import { BeDirective } from '../_shared/directives/let.directive';
import { mockFractionalValue } from '../dynamic-form/components/fractional-input.component';
import { AddEntityDialogComponent, AddEntityDialogData, AddEntityDialogResult } from '../_shared/components/add-entity-dialog.component';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

@Component({
    selector: 'app-foods-on-recipe-form',
    standalone: true,
    template: `
<div *appBe="state.select() | async as vm" class="flex flex-col gap-3">

  <div *ngIf="!disableCreateDelete">
    <button
      #btn
      type="button"
      class="bg-green-200 text-green-700 rounded-full px-4 py-2 text-bold text-sm active:bg-green-300 transition-all active:scale-95 w-full flex items-center justify-center gap-2"
      (click)="onAddBtnClick$.next()"
    >
      <span class="material-symbols-outlined text-base">search</span>
      Search for a food
    </button>
  </div>

  <p class="text-sm text-slate-500" *ngIf="!vm?.foodControls?.length">
    Search for ingredients to add from above.
  </p>

  <div *ngFor="let foodVm of vm?.foodControls ?? []; index as i; trackBy: trackByIndex" class="flex gap-3 items-center">
    <app-food-on-recipe-inputs
      [parent]="foodVm"
      [showScaledToRecipe]="showScaledToRecipe"
      [disableBaseInputs]="disableBaseInputs"
      [disableCreateDelete]="disableCreateDelete"
      [disableScaleChanging]="disableScaleChanging"
      (onFoodRemove)="onFoodRemove$.next(i)"
      class="w-full"
    />
  </div>
</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FoodOnRecipeInputComponent,
      ReactiveFormsModule, BeDirective, DialogModule],
    providers: [RxState, RxEffects],
})
export class FoodOnRecipeFormComponent implements OnInit {
  fb = inject(NonNullableFormBuilder);
  dialog = inject(Dialog);

  effects = inject(RxEffects);
  state: RxState<{
    // customError: Record<keyof ReturnType<FoodOnRecipeCtrl['getRawValue']>, string | undefined>,
    foodControls: FormArray<FoodOnRecipeCtrl>['controls'],
  }> = inject(RxState);


  onFoodRemove$ = new Subject<number>();
  onAddBtnClick$ = new Subject<void>();

  trackByIndex = trackByIndex;

  // searchParts: Array<keyof SearchResponse> = ['foods'];

  @Input() parent!: FormGroup;
  @Input() showScaledToRecipe = false;
  @Input() disableBaseInputs = false;
  @Input() disableCreateDelete = false;
  @Input() disableScaleChanging = false;
  // @Input() set customError(customError: Record<keyof ReturnType<FoodOnRecipeCtrl['getRawValue']>, string | undefined>[]) {
  //   this.state.set({ customError });
  // }

  ngOnInit(): void {
    this.parent.addControl('foods', this.fb.array<FoodOnRecipeCtrl>([]));
    const foodsFormArray = this.parent.get('foods') as FormArray<FoodOnRecipeCtrl>;

    this.effects.register(this.onAddBtnClick$.pipe(
      tap(() => {
        const dialogRef = this.dialog.open<AddEntityDialogResult, AddEntityDialogData>(AddEntityDialogComponent, {
          data: {
            entitiesToShow: ['food']
          },
        });

        dialogRef.closed.subscribe(result => {
          if (!result || result.type !== 'food') return;
          const newControl = FoodOnRecipeInputComponent.createFoodsControl({
            scaledToRecipe: mockFractionalValue,
            food: result.item,
            scale: mockFractionalValue,
            foodUnit: null,
          });
          foodsFormArray.push(newControl);
        });
      }),
    ));

    this.effects.register(this.onFoodRemove$, index => {
      foodsFormArray.removeAt(index);
    });

    this.state.connect('foodControls', rawValueChanges(foodsFormArray, true).pipe(
      map(() => foodsFormArray.controls),
    ));
  }

}
