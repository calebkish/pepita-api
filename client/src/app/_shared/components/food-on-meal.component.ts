import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Params, Router, RouterLink } from '@angular/router';
import { FoodOnMeal } from '../models/food-on-meal';
import { Subject, tap } from 'rxjs';
import { RxEffects } from '@rx-angular/state/effects';
import { ClipboardService } from '../services/clipboard.service';
import { Day } from '../models/day';

@Component({
  selector: 'app-food-on-meal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="w-100 rounded-xl flex items-center justify-between">
  <a
    [routerLink]="editPath"
    [queryParams]="editParams"
    class="text-md flex items-center"
  >
    {{ foodOnMeal.food.name }}
  </a>

  <button type="button" (click)="onCopy$.next()" class="flex items-center flex-col text-slate-500 active:bg-slate-200 p-1 rounded-md transition-all active:scale-95">
    <span class="material-symbols-outlined text-sm">content_copy</span>
    <p class="text-xs text-slate-600">Copy</p>
  </button>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxEffects],
})
export class FoodOnMealComponent {
  router = inject(Router);
  effects = inject(RxEffects);
  clipBoardService = inject(ClipboardService);

  onCopy$ = new Subject<void>();

  @Input() foodOnMeal!: FoodOnMeal;
  @Input() day!: Day['day'];

  editPath: string = 'food-instances/edit';
  editParams!: Params;

  constructor() {
    this.effects.register(this.onCopy$.pipe(
      tap(() => {
        this.clipBoardService.copy({
          day: this.day,
          foodOnMeal: this.foodOnMeal,
        });
      }),
    ));
  }

  ngOnInit(): void {
    this.editParams = {
      mealId: this.foodOnMeal.mealId,
      foodId: this.foodOnMeal.foodId,
    };
  }
}
