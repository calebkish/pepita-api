import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxState } from '@rx-angular/state';
import { calorieName, carbohydrateName, CoreNutrient, fatName, proteinName } from './models/core-nutrients';
import { BeDirective } from '../_shared/directives/let.directive';
import { NutrientViewModel } from './models/nutrient-view-model';
import { sortNutrients } from './util/sort-nutrients';

@Component({
  selector: 'app-core-nutrients',
  standalone: true,
  imports: [CommonModule, BeDirective],
  template: `
<ng-container>
  <div class="flex justify-between">
    <div *ngFor="let nutrient of state.select('nutrients') | async" class="flex flex-col gap-2 items-center">
      <div class="text-xs text-slate-800">
        {{nutrientNames[nutrient.name]}}
        <span class="text-slate-500">({{nutrient.unit}})</span>
      </div>
      <div class="text-sm font-bold flex flex-col items-center">
        <p>{{ nutrient.amount | number:'1.0-0' }}</p>
        <ng-container *ngIf="getGoal(nutrient) as goal">
          <hr>
          <p class="text-slate-500 text-xs">{{ goal | number:'1.0-0' }}</p>
        </ng-container>
      </div>
    </div>
  </div>
</ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class CoreNutrientsComponent {
  state: RxState<{
    nutrients: Omit<NutrientViewModel, 'nutrientId'>[],
  }> = inject(RxState);

  @Input() set nutrients(nutrients: Array<Omit<NutrientViewModel, 'nutrientId'>>) {
    if (!nutrients.find(n => n.name === calorieName)) {
      nutrients.push({ name: calorieName, unit: 'kcal', amount: 0 });
    }
    if (!nutrients.find(n => n.name === proteinName)) {
      nutrients.push({ name: proteinName, unit: 'g', amount: 0 });
    }
    if (!nutrients.find(n => n.name === carbohydrateName)) {
      nutrients.push({ name: carbohydrateName, unit: 'g', amount: 0 });
    }
    if (!nutrients.find(n => n.name === fatName)) {
      nutrients.push({ name: fatName, unit: 'g', amount: 0 });
    }
    this.state.set({ nutrients: nutrients.sort(sortNutrients) });
  }

  @Input() nutrientGoals?: Array<{ nutrient: CoreNutrient, goal: number }>;

  getGoal(nutrient: Omit<NutrientViewModel, 'nutrientId'>) {
    const goal = this.nutrientGoals?.find(goal => goal.nutrient === nutrient.name);
    if (goal) {
      return goal.goal;
    }
    return null;
  }

  protected nutrientNames: Record<string, string> = {
    [calorieName]: 'Calories',
    [proteinName]: 'Protein',
    [carbohydrateName]: 'Carbs',
    [fatName]: 'Fat',
  };
}
