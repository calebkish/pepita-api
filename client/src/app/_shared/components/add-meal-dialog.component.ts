import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TextInputComponent } from 'src/app/dynamic-form/components/text-input.component';
import { SubmitButtonComponent } from 'src/app/dynamic-form/components/submit-button.component';
import { AuthService } from '../services/auth.service';
import { RxState } from '@rx-angular/state';
import { filter, map, merge, Subject, switchMap, tap, withLatestFrom } from 'rxjs';
import { wrap, Wrapped } from '../util/wrap';
import { MealTemplate } from '../models/meal-template';
import { BeDirective } from '../directives/let.directive';
import { DayService } from '../services/day.service';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { ToastService } from '../services/toast.service';
import { ActiveDayService } from '../services/active-day.service';

export interface AddMealDialogData {
  day: string;
}

export type AddMealDialogResult = 'success' | 'fail';

@Component({
  selector: 'app-add-meal-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent, SubmitButtonComponent, BeDirective],
  template: `
<div class="bg-white rounded-xl p-5 flex flex-col gap-3" *appBe="state.select() | async as vm">
  <div *ngIf="vm?.mealTemplates?.length" class="flex flex-col gap-3">
    <p class="text-center text-sm text-slate-800">Create a meal from a template...</p>
    <div class="flex flex-col gap-3">
      <button
        *ngFor="let mealTemplate of vm?.mealTemplates ?? []"
        type="button"
        class="w-full bg-slate-200 text-slate-700 block rounded-full px-4 py-2 text-bold text-sm active:bg-slate-300 transition-all active:scale-95"
        (click)="onCreateMealFromTemplate.next({ mealTemplateId: mealTemplate.id })"
      >
        {{ mealTemplate.name }}
      </button>

      <button
        *ngIf="(vm?.mealTemplates?.length ?? 0) > 1"
        (click)="onAddMissingMealTemapltes$.next()"
        class="bg-slate-200 text-slate-700 block rounded-full px-4 py-2 text-bold text-sm active:bg-slate-300 transition-all active:scale-95"
        type="button"
      >
        Add all missing meal templates
      </button>
    </div>

    <div class="relative bg-white flex justify-center">
      <hr class="border-slate-600 absolute top-3 left-0 right-0 w-full h-full">
      <p class="text-slate-600 relative bg-inherit z-10 inline-block px-3">OR</p>
    </div>
  </div>

  <p class="text-center text-sm text-slate-800">Create a custom meal...</p>
  <form [formGroup]="form" (ngSubmit)="onSubmitMealName.next()">
    <app-text-input
      formCtrlName="name"
      label="Name"
      [showLabel]="false"
      placeholder="Meal name"
    ></app-text-input>
    <app-submit-button label="Create"></app-submit-button>
  </form>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class AddMealDialogComponent implements OnInit {
  fb = inject(NonNullableFormBuilder);
  authService = inject(AuthService);
  dayService = inject(DayService);
  activeDayService = inject(ActiveDayService);
  dialogRef: DialogRef<AddMealDialogResult, AddMealDialogComponent> = inject(DialogRef);
  dialogData: AddMealDialogData = inject(DIALOG_DATA);
  toastService = inject(ToastService);
  state: RxState<{
    mealTemplates: MealTemplate[],
    createFromMealTemplateResponse: Wrapped<any>,
    addMissingMealTemplatesResponse: Wrapped<any>,
  }> = inject(RxState);

  onCreateMealFromTemplate = new Subject<{ mealTemplateId: string }>();
  onSubmitMealName = new Subject<void>();
  onAddMissingMealTemapltes$ = new Subject<void>();

  form = this.fb.group({
    name: this.fb.control('', [requiredValidator]),
  });

  ngOnInit(): void {
    this.state.connect('mealTemplates', this.authService.settings$.pipe(
      withLatestFrom(this.dayService.get$(this.dialogData.day)),
      map(([settings, day]) => {
        const alreadyAddedMealTemplateIds = new Set(day.data?.mealsOnDays.map(mealOnDay => mealOnDay.meal.mealTemplateId));
        return settings.autoCreatedMealTemplates
          .filter(template => !alreadyAddedMealTemplateIds.has(template.id));
      }),
    ));

    this.state.connect('createFromMealTemplateResponse', merge(
      this.onCreateMealFromTemplate.pipe(map(({ mealTemplateId }) => ({ mealTemplateIds: [mealTemplateId] }))),
      this.onSubmitMealName.pipe(
        filter(() => this.form.valid),
        map(() => ({ name: this.form.value.name! })),
      )
    ).pipe(
      switchMap((createMealBody) => this.dayService.addMealToDay$(this.dialogData.day, createMealBody)),
      wrap(),
      tap(res => {
        if (res.error) {
          this.toastService.open({ message: res.error?.error ?? 'Failed to create meal' });
          this.dialogRef.close('fail');
        }
        if (res.data) {
          this.dayService.invalidate(this.dialogData.day);
          this.dialogRef.close('success');
        }
      }),
    ));

    this.state.connect('addMissingMealTemplatesResponse', this.onAddMissingMealTemapltes$.pipe(
      withLatestFrom(this.state.select('mealTemplates')),
      switchMap(([_, mealTemplates]) => {
        return this.dayService.addMealToDay$(this.dialogData.day, { mealTemplateIds: mealTemplates.map(t => t.id) })
      }),
      wrap(),
      tap(res => {
        if (res.error) {
          this.toastService.open({ message: 'All meal templates are already added to the day' });
          this.dialogRef.close('fail');
        }
        if (res.data) {
          this.dayService.invalidate(this.dialogData.day);
          this.dialogRef.close('success');
        }
      }),
    ));
  }
}
