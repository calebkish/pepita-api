import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxState } from '@rx-angular/state';
import { BeDirective } from '../_shared/directives/let.directive';
import { NutrientViewModel } from './models/nutrient-view-model';
import { aggregateNutrients } from './util/aggregate-nutrients';

@Component({
  selector: 'app-nutrients',
  standalone: true,
  imports: [CommonModule, BeDirective],
  template: `
<ng-container *appBe="state.select() | async as vm">
  <div *ngIf="vm?.nutrients?.length" class="gap-1 grid [grid-template-columns:1fr_min-content_min-content]">
    <ng-container *ngFor="let nutrient of vm?.nutrients ?? []">
      <div class="text-sm text-slate-800">{{ nutrient.name }}</div>
      <div class="text-slate-900 justify-self-end">{{ nutrient.amount | number:'1.1-1' }}</div>
      <div class="text-sm text-slate-600 self-end">{{ nutrient.unit }}</div>
    </ng-container>
  </div>
</ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class NutrientsComponent {
  state: RxState<{
    nutrients: NutrientViewModel[],
  }> = inject(RxState);

  @Input() set nutrients(nutrients: NutrientViewModel[]) {
    this.state.set({ nutrients: aggregateNutrients(nutrients) });
  }
}
