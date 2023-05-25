import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxState } from '@rx-angular/state';
import { AccountSettings, AuthService, PostAccountSettingsRequest } from '../services/auth.service';
import { wrap, Wrapped } from '../util/wrap';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TextInputComponent } from '../../dynamic-form/components/text-input.component';
import { NumberInputComponent } from '../../dynamic-form/components/number-input.component';
import { SubmitButtonComponent } from '../../dynamic-form/components/submit-button.component';
import { distinctUntilChanged, filter, map, Subject, switchMap, take, tap } from 'rxjs';
import { requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { AutocompleteInputComponent } from "../../dynamic-form/components/autocomplete-input.component";
import { BeDirective } from '../directives/let.directive';
import { MealTemplate } from '../models/meal-template';
import { trackByIndex } from '../util/track-by-index';
import { RxEffects } from '@rx-angular/state/effects';
import { rawValueChanges } from 'src/app/dynamic-form/util/raw-value-changes';
import { Router } from '@angular/router';
import { RangeInputComponent } from "../../dynamic-form/components/range-input.component";
import { MealTemplateInputComponent } from "./meal-template-input.component";
import { ToastService } from '../services/toast.service';

export type MealTemplateCtrl = ReturnType<typeof AccountDetailComponent.createNewMealTemplateFormGroup>;

export type DailyTargets = Pick<MealTemplate, 'calories' | 'carbohydrates' | 'protein' | 'fat'> & { factorsTotal: number };

@Component({
    selector: 'app-account-detail',
    standalone: true,
    template: `
<div *appBe="state.select() | async as vm" class="p-5 flex flex-col gap-6">
  <form (ngSubmit)="onSubmit.next()" [formGroup]="form">

    <div class="flex flex-col gap-6 items-center">
      <p class="text-2xl text-slate-900 font-bold">Daily nutrient goals</p>
      <div class="flex flex-col sm:gap-3 sm:flex-row justify-center">
        <app-number-input
          formCtrlName="dailyTargetCalories"
          label="Daily target calories"
        />
        <app-number-input
          formCtrlName="dailyTargetProtein"
          label="Daily target protein"
        />
        <app-number-input
          formCtrlName="dailyTargetCarbohydrates"
          label="Daily target carbs"
        />
        <app-number-input
          formCtrlName="dailyTargetFat"
          label="Daily target fat"
        />
      </div>
    </div>

    <div class="flex flex-col gap-6 items-center">
      <p class="text-2xl text-slate-900 font-bold">Meal templates</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl m-auto">
        <div
          *ngFor="let template of vm?.mealTemplates ?? []; index as i; trackBy: trackByIndex"
          class="bg-slate-100 rounded-lg p-4"
        >
          <app-meal-template-input
            [parent]="template"
            [dailyTargets]="vm!.dailyTargets"
            (remove)="onMealTemplateRemove$.next(i)"
          />
        </div>
      </div>

      <button
        (click)="onMealTemplateAdd$.next()"
        title="Add serving unit"
        class="bg-green-200 text-green-700 block rounded-full px-4 py-2 text-bold text-sm active:bg-green-300 transition-all active:scale-95"
        type="button"
      >Add a meal template</button>
    </div>

    <app-submit-button class="block mt-5 max-w-lg m-auto" label="Save daily goals and meal templates" />
  </form>

  <hr class="border-slate-300 w-full h-full" />

  <div>
    <button
      type="button"
      class="bg-red-200 text-red-700 rounded-full px-4 py-2 text-bold text-sm active:bg-red-300 transition-all active:scale-95 flex gap-1 items-center"
      (click)="onLogout.next()"
    >
      <span class="material-symbols-outlined text-sm">logout</span>
      Logout
    </button>
  </div>

</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [RxState, RxEffects],
    imports: [
      CommonModule,
      ReactiveFormsModule,
      TextInputComponent,
      NumberInputComponent,
      SubmitButtonComponent,
      AutocompleteInputComponent,
      BeDirective,
      RangeInputComponent,
      MealTemplateInputComponent
    ],
})
export class AccountDetailComponent {
  trackByIndex = trackByIndex;

  authService = inject(AuthService);
  fb = inject(NonNullableFormBuilder);
  router = inject(Router);
  state: RxState<{
    settings: Wrapped<AccountSettings>;
    saveResponse: Wrapped<any>;
    mealTemplates: FormArray<MealTemplateCtrl>['controls'];
    dailyTargets: DailyTargets;
    logoutResponse: Wrapped<any>;
  }> = inject(RxState);
  effects = inject(RxEffects);
  toast = inject(ToastService);

  onSubmit = new Subject<void>();
  onMealTemplateAdd$ = new Subject<void>();
  onMealTemplateRemove$ = new Subject<number>();
  onLogout = new Subject<void>();

  form = this.fb.group({
    dailyTargetCalories: this.fb.control(0, { updateOn: 'change', validators: [requiredValidator] }),
    dailyTargetProtein: this.fb.control(0, { updateOn: 'change', validators: [requiredValidator] }),
    dailyTargetCarbohydrates: this.fb.control(0, { updateOn: 'change', validators: [requiredValidator] }),
    dailyTargetFat: this.fb.control(0, { updateOn: 'change', validators: [requiredValidator] }),
    autoCreatedMealTemplates: this.fb.array<MealTemplateCtrl>([]),
  });


  constructor() {
    this.state.connect(
      'saveResponse',
      this.onSubmit.pipe(
        filter(() => this.form.valid),
        switchMap(() => {
          const val = this.form.getRawValue();

          const {
            dailyTargetCalories,
            autoCreatedMealTemplates,
            dailyTargetCarbohydrates,
            dailyTargetProtein,
            dailyTargetFat,
          } = val;

          const factorsTotal = val.autoCreatedMealTemplates.reduce((prev, curr) => prev + curr.factor, 0);

          const req: PostAccountSettingsRequest = {
            dailyTargetCalories: dailyTargetCalories,
            dailyTargetCarbohydrates: dailyTargetCarbohydrates,
            dailyTargetProtein: dailyTargetProtein,
            dailyTargetFat: dailyTargetFat,
            autoCreatedMealTemplates: autoCreatedMealTemplates.map(mealTemplate => {
              const ratio = (() => {
                const initialRatio = mealTemplate.factor / factorsTotal;
                return Number.isNaN(initialRatio) ? 0 : initialRatio;
              })();
              return {
                calories: dailyTargetCalories * ratio,
                carbohydrates: dailyTargetCarbohydrates * ratio,
                fat: dailyTargetFat * ratio,
                protein: dailyTargetProtein * ratio,
                name: mealTemplate.name,
                factor: mealTemplate.factor,
              };
            }),
          };

          return this.authService.postSettings$(req).pipe(
            tap((settings) => {
              // @TODO instead, invalidate settings and re-query
              this.toast.open({ message: 'Daily goals and meal templates saved!' });
              this.authService.setSettings$.next(settings);
            }),
            wrap(),
          );
        }),
      )
    );

    this.state.connect('dailyTargets', rawValueChanges(this.form, true).pipe(
      map(val => {
        return {
          calories: val.dailyTargetCalories,
          protein: val.dailyTargetProtein,
          carbohydrates: val.dailyTargetCarbohydrates,
          fat: val.dailyTargetFat,
          factorsTotal: val.autoCreatedMealTemplates.reduce((prev, curr) => prev + curr.factor, 0),
        };
      }),
    ));

    const autoCreatedMealTemplatesCtrl = this.form.get('autoCreatedMealTemplates') as FormArray<MealTemplateCtrl>;

    this.effects.register(this.onMealTemplateAdd$.pipe(
      tap(() => {
        const newControl = AccountDetailComponent.createNewMealTemplateFormGroup();
        autoCreatedMealTemplatesCtrl.push(newControl);
      }),
    ));

    this.effects.register(this.onMealTemplateRemove$.pipe(
      tap((index) => {
        autoCreatedMealTemplatesCtrl.removeAt(index);
      }),
    ));

    this.state.connect('mealTemplates', rawValueChanges(autoCreatedMealTemplatesCtrl, true).pipe(
      map(() => autoCreatedMealTemplatesCtrl.controls.length),
      distinctUntilChanged(),
      map(() => autoCreatedMealTemplatesCtrl.controls),
    ));

    this.state.connect('settings', this.authService.settings$.pipe(
      take(1), // @TODO make this more robust I guess
      wrap(),
      tap((response) => {
        if (response.data) {
          const formArray = this.form.get('autoCreatedMealTemplates') as FormArray;

          for (const _ of response.data.autoCreatedMealTemplates) {
            const newControl = AccountDetailComponent.createNewMealTemplateFormGroup();
            formArray.push(newControl, { emitEvent: false });
          }

          this.form.patchValue({
            dailyTargetCalories: response.data.dailyTargetCalories ?? 0,
            dailyTargetCarbohydrates: response.data.dailyTargetCarbohydrates ?? 0,
            dailyTargetProtein: response.data.dailyTargetProtein ?? 0,
            dailyTargetFat: response.data.dailyTargetFat ?? 0,
            autoCreatedMealTemplates: response.data.autoCreatedMealTemplates,
          });
        }
      }),
    ));

    this.state.connect('logoutResponse', this.onLogout.pipe(
      switchMap(() => this.authService.logout$().pipe(wrap())),
      tap((res) => {
        if (res.data) {
          this.authService.setAccount$.next(null);
          this.router.navigateByUrl('');
        }
      }),
    ));
  }

  static createNewMealTemplateFormGroup() {
    const newGroup = new FormGroup({
      name: new FormControl<MealTemplate['name']>(
        '',
        {
          nonNullable: true,
          validators: [requiredValidator],
          updateOn: 'change'
        },
      ),
      factor: new FormControl<number>(
        0,
        {
          nonNullable: true,
          validators: [requiredValidator],
          updateOn: 'change'
        },
      ),
    });

    return newGroup;
  }

}
