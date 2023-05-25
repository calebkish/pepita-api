import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyTargets, MealTemplateCtrl } from './account-detail.component';
import { TextInputComponent } from "../../dynamic-form/components/text-input.component";
import { RangeInputComponent } from "../../dynamic-form/components/range-input.component";
import { ReactiveFormsModule } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { combineLatestWith, map } from 'rxjs';
import { rawValueChanges } from 'src/app/dynamic-form/util/raw-value-changes';

@Component({
    selector: 'app-meal-template-input',
    standalone: true,
    template: `
<div [formGroup]="parent" class="flex flex-col items-center">
  <app-text-input
    label="Name"
    formCtrlName="name"
    class="w-full"
  />

  <app-range-input
    label="Factor"
    formControlName="factor"
    [min]="0"
    [max]="5"
    [step]="1"
  />

  <div *ngIf="state.select('mealNutrients') | async as mealNutreints" class="grid grid-cols-2 gap-3">
    <p class="text-xs">Calories: <strong>{{ mealNutreints.calories | number:'1.0-0' }}</strong></p>
    <p class="text-xs">Protein: <strong>{{ mealNutreints.protein | number:'1.0-0' }}</strong></p>
    <p class="text-xs">Carbs: <strong>{{ mealNutreints.carbohydrates | number:'1.0-0' }}</strong></p>
    <p class="text-xs">Fat: <strong>{{ mealNutreints.fat | number:'1.0-0' }}</strong></p>
  </div>

  <button
    type="button"
    class="mt-5 bg-red-200 text-red-700 rounded-full px-4 py-2 text-bold text-sm active:bg-red-300 transition-all active:scale-95 flex gap-1 items-center"
    (click)="remove.emit()"
  >
    Remove meal template
  </button>

</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TextInputComponent, RangeInputComponent, ReactiveFormsModule],
    providers: [RxState],
})
export class MealTemplateInputComponent {
  state: RxState<{
    dailyTargets: DailyTargets,
    mealNutrients: Omit<DailyTargets, 'factorsTotal'>,
  }> = inject(RxState);

  @Input() parent!: MealTemplateCtrl;

  @Input() set dailyTargets(dailyTargets: DailyTargets) {
    this.state.set({ dailyTargets });
  }

  @Output() remove = new EventEmitter<void>();

  ngOnInit(): void {
    this.state.connect('mealNutrients', rawValueChanges(this.parent.controls.factor, true).pipe(
      combineLatestWith(this.state.select('dailyTargets')),
      map(([factor, dailyTargets]) => {
        const ratio = (() => {
          const initialRatio = factor / dailyTargets.factorsTotal;
          return Number.isNaN(initialRatio) ? 0 : initialRatio;
        })();
        return {
          calories: dailyTargets.calories * ratio,
          carbohydrates: dailyTargets.carbohydrates * ratio,
          fat: dailyTargets.fat * ratio,
          protein: dailyTargets.protein * ratio,
        };
      }),
    ));
  }
}
