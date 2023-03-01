import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe } from 'src/app/_shared/models/recipe';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-recipes-list-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="bg-slate-100 w-100 p-4 rounded-xl flex items-center justify-between">
  <div class="flex flex-center gap-2 items-center">
    <a [routerLink]="recipeEditPath" class="text-lg flex items-center">
      {{ recipe.name }}
    </a>
  </div>
  <div class="flex items-center gap-4">
    <a
      *ngIf="!recipe.isBatchRecipe"
      title="Create batch recipe"
      (click)="onCreateBatchRecipe()"
      class="text-lg flex items-center text-slate-500 cursor-pointer"
    >
      <span class="material-symbols-outlined">set_meal</span>
    </a>
  </div>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipesListItemComponent {
  router = inject(Router);

  @Input() recipe!: Recipe;

  recipeEditPath!: string;

  ngOnInit(): void {
    this.recipeEditPath = this.recipe.isBatchRecipe
      ? `/batch-recipes/${this.recipe.id}/edit`
      : `/recipes/${this.recipe.id}/edit`;
  }

  onCreateBatchRecipe(): void {
    this.router.navigate(['batch-recipes', 'create'], {
      queryParams: {
        recipeId: this.recipe.id,
      },
    });
  }
}
