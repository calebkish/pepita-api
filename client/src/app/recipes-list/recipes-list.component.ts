import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxState } from '@rx-angular/state';
import { wrap, Wrapped } from 'src/app/_shared/util/wrap';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { RouterModule } from '@angular/router';
import { Recipe } from 'src/app/_shared/models/recipe';
import { RecipesListItemComponent } from "./recipes-list-item.component";
import { RecipeService } from '../_shared/services/recipe.service';
import { filter, map } from 'rxjs';

@Component({
    selector: 'app-recipes-list',
    standalone: true,
    providers: [RxState],
    template: `
<div *appBe="state.select() | async as vm" class="flex flex-col gap-8 max-w-lg mx-auto p-5">

  <div>
    <h2 class="text-2xl font-bold text-slate-900">Batch Recipes</h2>
    <div *ngIf="vm?.batchRecipes?.length; else noBatchRecipes" class="mt-4 flex flex-col gap-3">
      <app-recipes-list-item *ngFor="let recipe of vm?.batchRecipes" [recipe]="recipe" />
    </div>
    <ng-template #noBatchRecipes>
      <p class="text-slate-600 text-center py-5 text-sm">No batch recipes exist. Create one from an existing recipe.</p>
    </ng-template>
  </div>

  <div>
    <div class="flex justify-between">
      <h2 class="text-2xl font-bold text-slate-900">Recipes</h2>
      <button routerLink="/recipes/create" class="btn btn-primary">Create recipe</button>
    </div>
    <div *ngIf="vm?.recipes?.length; else noRecipes" class="mt-4 flex flex-col gap-3">
      <app-recipes-list-item *ngFor="let recipe of vm?.recipes" [recipe]="recipe" />
    </div>
    <ng-template #noRecipes>
      <p class="text-slate-600 text-center py-5 text-sm">No recipes exist.</p>
    </ng-template>
  </div>

</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, BeDirective, RouterModule, RecipesListItemComponent]
})
export class RecipesListComponent {
  recipeService = inject(RecipeService);
  state: RxState<{
    recipesResponse: Wrapped<Recipe[]>,
    recipes: Recipe[],
    batchRecipes: Recipe[],
  }> = inject(RxState);

  constructor() {
    this.state.connect('recipesResponse', this.recipeService.getRecipes$().pipe(
      wrap(),
    ));

    this.state.connect('recipes', this.state.select('recipesResponse').pipe(
      filter(res => !!res.data),
      map(res => res.data!.filter(recipe => !recipe.isBatchRecipe)),
    ));

    this.state.connect('batchRecipes', this.state.select('recipesResponse').pipe(
      filter(res => !!res.data),
      map(res => res.data!.filter(recipe => recipe.isBatchRecipe)),
    ));
  }
}
