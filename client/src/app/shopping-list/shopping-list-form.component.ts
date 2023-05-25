import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeDirective } from '../_shared/directives/let.directive';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { wrap, Wrapped } from '../_shared/util/wrap';
import { FoodListItem, ShoppingList, ShoppingListRes, ShoppingListService } from '../_shared/services/shopping-list.service';
import { Subject, tap, map, filter, switchMap, withLatestFrom, take, merge, of, catchError, EMPTY } from 'rxjs';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { requiredValidator } from '../dynamic-form/util/has-gram-validator';
import { DpDatePickerModule, IDatePickerDirectiveConfig } from 'ng2-date-picker';
import { rawValueChanges } from '../dynamic-form/util/raw-value-changes';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../_shared/services/toast.service';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-shopping-list-form',
  standalone: true,
  imports: [CommonModule, BeDirective, ReactiveFormsModule, DpDatePickerModule],
  template: `
<div *appBe="state.select() | async as vm" class="flex flex-col gap-8 max-w-xl mx-auto p-5">

  <div class="flex flex-col items-center gap-5">
    <button
      *ngIf="vm?.formMode === 'edit'"
      (click)="onDelete$.next()"
      class="bg-red-200 text-red-700 rounded-full px-4 py-2 text-bold text-sm active:bg-red-300 transition-all active:scale-95 w-fit flex items-center gap-1"
      type="button"
    >
      <span class="material-symbols-outlined">delete</span>
      Delete shopping list
    </button>

    <div class="flex items-center justify-center gap-2" [formGroup]="form">
      <p>Start</p>
      <input
        #dateDirective="dpDayPicker"
        class="bg-white border-2 rounded-md w-28 h-full text-center text-gray-900 focus:outline focus:outline-2 focus:outline-gray-500"
        formControlName="startDay"
        [dpDayPicker]="config"
        theme="dp-material dp-main"
      />

      <p>End</p>
      <input
        #dateDirective="dpDayPicker"
        class="bg-white border-2 rounded-md w-28 h-full text-center text-gray-900 focus:outline focus:outline-2 focus:outline-gray-500"
        formControlName="endDay"
        [dpDayPicker]="config"
        theme="dp-material dp-main"
      />
    </div>

  </div>

  <div class="flex flex-col gap-3">
    <div
      *ngFor="let food of (vm?.shoppingListRes?.data?.itemsGroupedByFoodsReducedByUnits ?? {}) | keyvalue"
      class="flex flex-col gap-2 p-2"
    >
      <p class="text-md font-bold">{{ food.key }} ({{ reduceToGrams(food.value) | number:'1.0-0' }}g)</p>
      <div class="flex flex-col">
        <div *ngFor="let reducedUnit of food.value">
          <p class="text-sm">
            {{ reducedUnit.amount }}
            {{ reducedUnit.foodUnit.name }}
            ({{ reducedUnit.grams | number:'1.0-0' }}g)</p>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState, RxEffects],
})
export class ShoppingListFormComponent {
  state: RxState<{
    shoppingListRes: Wrapped<ShoppingListRes>,
    formMode: FormMode,
    deleteResponse: Wrapped<void>,
  }> = inject(RxState);
  effects = inject(RxEffects);

  shoppingListService = inject(ShoppingListService);
  fb = inject(NonNullableFormBuilder);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);

  onDelete$ = new Subject<void>();

  config: IDatePickerDirectiveConfig = { format: 'YYYY-MM-DD' };

  form = this.fb.group<{
    startDay: FormControl<string>,
    endDay: FormControl<string>,
  }>({
    startDay: this.fb.control<ShoppingList['startDay']>('', [requiredValidator]),
    endDay: this.fb.control<ShoppingList['endDay']>('', [requiredValidator]),
  }, { updateOn: 'blur' });

  reduceToGrams(items: FoodListItem[]): number {
    return items.reduce((prev, curr) => {
      return prev + curr.grams;
    }, 0);
  }

  constructor() {
    const shoppingListId$ = this.activatedRoute.params.pipe(map(params => params['shoppingListId'] as string));
    const refetch$ = new Subject<string | void>();

    this.effects.register(this.onDelete$.pipe(
      withLatestFrom(shoppingListId$),
      switchMap(([_, id]) => this.shoppingListService.deleteShoppingList$(id)),
      tap(() => {
        this.toastService.open({ message: 'Shopping list deleted' });
        this.router.navigate(['shopping-lists']);
      }),
      catchError((err) => {
        this.toastService.open({ message: 'Failed to delete shopping list' });
        return EMPTY;
      }),
    ));

    this.state.connect('formMode', this.activatedRoute.url, (_, urlSegments) => {
      return urlSegments[1].path === 'create' ? 'create' : 'edit';
    });

    // Populate seed data
    this.effects.register(this.state.select('shoppingListRes').pipe(
      filter(res => !res.loading && !!res.data),
      take(1),
      tap(shoppingListRes => {
        this.form.setValue({
          startDay: shoppingListRes.data?.shoppingList.startDay ?? '',
          endDay: shoppingListRes.data?.shoppingList.endDay ?? '',
        }, { emitEvent: false });
      }),
    ));

    this.state.connect('shoppingListRes',
      merge(
        shoppingListId$,
        refetch$.pipe(switchMap((id) => id ? of(id) : shoppingListId$)),
      )
        .pipe(
          filter(shoppingListId => !!shoppingListId),
          switchMap((shoppingListId) => {
            return this.shoppingListService.getShoppingList$(shoppingListId);
          }),
          wrap(),
        ),
    );

    this.effects.register(rawValueChanges(this.form, true).pipe(
      filter(formValue => !!formValue.startDay && !!formValue.endDay),
      withLatestFrom(this.state.select('shoppingListRes')),
      switchMap(([formValue, res]) => {
        return this.shoppingListService.putShoppingList$({
          startDay: formValue.startDay,
          endDay: formValue.endDay,
          shoppingListId: res.data?.shoppingList?.id,
          purchasedFoodsIds: res.data?.shoppingList?.purchasedFoodsIds ?? [],
        });
      }),
      tap((res) => {
        refetch$.next(res.id);
      }),
    ));

  }
}
