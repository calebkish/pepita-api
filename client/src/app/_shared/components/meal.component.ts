import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealOnDay } from '../models/meal-on-day';
import { Subject, switchMap, tap } from 'rxjs';
import { RxState } from '@rx-angular/state';
import { wrap, Wrapped } from '../util/wrap';
import { Meal } from '../models/meal';
import { MealService } from '../services/meal.service';
import { DayService } from '../services/day.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { RxEffects } from '@rx-angular/state/effects';
import { RecipeOnMealComponent } from "./recipe-on-meal.component";
import { FoodOnMealComponent } from "./food-on-meal.component";
import { ClipboardService, ItemSelection } from '../services/clipboard.service';
import { BeDirective } from '../directives/let.directive';
import { AddEntityDialogComponent, AddEntityDialogResult } from './add-entity-dialog.component';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

@Component({
    selector: 'app-meal',
    standalone: true,
    providers: [RxState, RxEffects],
    template: `
<div *appBe="state.select() | async as vm" class="border-slate-200 shadow-slate-200 rounded-xl flex flex-col gap-3">
  <div class="flex justify-between">
    <div class="flex gap-2 align-center">
      <div class="flex gap-1 items-start">
        <p class="text-2xl font-bold text-slate-900">{{ mealOnDay.meal.name }}</p>
        <span
          *ngIf="mealOnDay.meal.mealTemplateId"
          class="material-symbols-outlined text-cyan-500 text-sm"
          title="This meal is associated with the {{ mealOnDay.meal.mealTemplate.name}} meal template"
        >magic_button</span>
      </div>

      <button
        type="button"
        *ngIf="vm?.clipboard"
        (click)="onClipboardPaste$.next()"
        class="flex items-center flex-col text-slate-500 active:bg-slate-200 p-1 rounded-md transition-all active:scale-95"
      >
        <span class="material-symbols-outlined text-sm">content_paste</span>
        <p class="text-xs text-slate-600">Paste</p>
      </button>

      <!-- <button -->
      <!--   type="button" -->
      <!--   *ngIf="vm?.clipboard" -->
      <!--   class="text-slate-700 rounded-full px-1 text-bold text-xs active:bg-slate-200 bg-slate-50 transition-all active:scale-95 flex items-center" -->
      <!--   (click)="onClipboardPaste$.next()" -->
      <!-- > -->
      <!--   <span class="material-symbols-outlined">content_paste</span> -->
      <!-- </button> -->
    </div>
    <div class="flex gap-3">
      <button
        type="button"
        class="text-green-700 block rounded-full px-1 text-bold text-xs active:bg-green-200 bg-green-50 transition-all active:scale-95"
        (click)="onAddBtnClick$.next()"
      >
        <span class="material-symbols-outlined pt-1">add</span>
      </button>
      <button
        type="button"
        class="text-red-700 block rounded-full px-1 text-bold text-xs active:bg-red-200 transition-all active:scale-95"
        (click)="onDeleteMeal$.next({ mealId: mealOnDay.meal.id })"
      >
        <span class="material-symbols-outlined pt-1">delete</span>
      </button>
    </div>
  </div>

  <div *ngFor="let recipeOnMeal of mealOnDay.meal.recipesOnMeals">
    <app-recipe-on-meal [recipeOnMeal]="recipeOnMeal" [day]="day" />
  </div>

  <div *ngFor="let foodOnMeal of mealOnDay.meal.foodsOnMeals">
    <app-food-on-meal [foodOnMeal]="foodOnMeal" [day]="day" />
  </div>

</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      CommonModule, RouterModule, OverlayModule,
      RecipeOnMealComponent, RouterLink, FoodOnMealComponent, BeDirective
    ]
})
export class MealComponent implements OnInit {
  dayService = inject(DayService);
  mealService = inject(MealService);
  clipboardService = inject(ClipboardService);
  router = inject(Router);
  dialog = inject(Dialog);

  effects = inject(RxEffects);
  state: RxState<{
    deleteResponse: Wrapped<Meal>,
    clipboard: ItemSelection | null,
  }> = inject(RxState);

  @Input() day!: string;
  @Input() mealOnDay!: MealOnDay;

  onAddBtnClick$ = new Subject<void>();
  onDeleteMeal$ = new Subject<{ mealId: string }>();
  onClipboardPaste$ = new Subject<void>();

  constructor() {
    this.effects.register(this.onClipboardPaste$.pipe(
      switchMap(() => {
        return this.clipboardService.paste$({
          day: this.day,
          mealId: this.mealOnDay.mealId,
        });
      }),
    ));

    this.effects.register(this.onAddBtnClick$.pipe(
      tap(() => {
        const dialogRef = this.dialog.open<AddEntityDialogResult>(AddEntityDialogComponent, {
          data: {},
        });

        dialogRef.closed.subscribe(result => {
          if (!result) return;
          if (result.type === 'food') {
            this.router.navigate(['food-instances', 'create'], {
              queryParams: {
                foodId: result.item.id,
                mealId: this.mealOnDay.mealId,
              },
            });
          } else if (result.type === 'recipe') {
            this.router.navigate(['recipe-instances', 'create'], {
              queryParams: {
                recipeId: result.item.id,
                mealId: this.mealOnDay.mealId,
              },
            });
          } else if (result.type === 'batchRecipe') {
            this.router.navigate(['batch-recipe-instances', 'create'], {
              queryParams: {
                owningBatchRecipeId: result.item.id,
                mealId: this.mealOnDay.mealId,
              },
            });
          }
        });
      }),
    ));
  }

  ngOnInit(): void {
    this.state.connect('deleteResponse', this.onDeleteMeal$.pipe(
      switchMap(({ mealId }) => {
        return this.mealService.deleteMeal$(mealId).pipe(
          tap(() => {
            this.dayService.invalidate(this.day);
          }),
          wrap(),
        );
      }),
    ));

    this.state.connect('clipboard', this.clipboardService.clipboard$);
  }
}

