import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RxEffects } from '@rx-angular/state/effects';
import { Subject, tap } from 'rxjs';
import { Day } from '../models/day';
import { RecipeOnMeal } from '../models/meal';
import { ClipboardService } from '../services/clipboard.service';

@Component({
  selector: 'app-recipe-on-meal',
  standalone: true,
  imports: [RouterLink],
  template: `
<div class="w-100 rounded-xl flex items-center justify-between">
  <a [routerLink]="recipeEditPath" class="text-md flex items-center">{{ recipeOnMeal.recipe.name }}</a>

  <button type="button" (click)="onCopy$.next()" class="flex items-center flex-col text-slate-500 active:bg-slate-200 p-1 rounded-md transition-all active:scale-95">
    <span class="material-symbols-outlined text-sm">content_copy</span>
    <p class="text-xs text-slate-600">Copy</p>
  </button>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxEffects],
})
export class RecipeOnMealComponent {
  router = inject(Router);
  effects = inject(RxEffects);
  clipBoardService = inject(ClipboardService);

  onCopy$ = new Subject<void>();

  @Input() recipeOnMeal!: RecipeOnMeal;
  @Input() day!: Day['day'];

  recipeEditPath!: string;

  constructor() {
    this.effects.register(this.onCopy$.pipe(
      tap(() => {
        this.clipBoardService.copy({
          day: this.day,
          recipeOnMeal: this.recipeOnMeal,
        });
      }),
    ));
  }

  ngOnInit(): void {
    this.recipeEditPath = this.recipeOnMeal.recipe.owningBatchRecipeId !== null
      ? `/batch-recipe-instances/${this.recipeOnMeal.recipe.id}/edit`
      : `/recipe-instances/${this.recipeOnMeal.recipe.id}/edit`;
  }
}
