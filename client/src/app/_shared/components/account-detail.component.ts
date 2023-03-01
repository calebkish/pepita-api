import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxState } from '@rx-angular/state';
import { AccountSettings, AuthService, PostAccountSettingsRequest } from '../services/auth.service';
import { wrap, Wrapped } from '../util/wrap';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TextInputComponent } from '../../dynamic-form/components/text-input.component';
import { NumberInputComponent } from '../../dynamic-form/components/number-input.component';
import { SubmitButtonComponent } from '../../dynamic-form/components/submit-button.component';
import { filter, Subject, switchMap, take, tap } from 'rxjs';
import { requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { AutocompleteInputComponent } from "../../dynamic-form/components/autocomplete-input.component";
import { BeDirective } from '../directives/let.directive';
import { MealTemplate } from '../models/meal-template';
import { trackByIndex } from '../util/track-by-index';
import { RxEffects } from '@rx-angular/state/effects';
import { rawValueChanges } from 'src/app/dynamic-form/util/raw-value-changes';
import { Router } from '@angular/router';

@Component({
    selector: 'app-account-detail',
    standalone: true,
    template: `
<div *appBe="state.select() | async as vm" class="p-5 flex flex-col gap-3">
  <form (ngSubmit)="onSubmit.next()" [formGroup]="form">
    <div class="flex gap-3">
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

    <div>
      <div class="flex gap-3 items-center" *ngFor="let template of vm?.mealTemplates ?? []; index as i; trackBy: trackByIndex">
        <app-text-input
          label="Name"
          formCtrlName="autoCreatedMealTemplates.{{i}}.name"
        />
        <app-number-input
          label="Order"
          formCtrlName="autoCreatedMealTemplates.{{i}}.order"
        />
        <app-number-input
          label="Calories"
          formCtrlName="autoCreatedMealTemplates.{{i}}.calories"
        />
        <app-number-input
          label="Protein"
          formCtrlName="autoCreatedMealTemplates.{{i}}.protein"
        />
        <app-number-input
          label="Carbohydrates"
          formCtrlName="autoCreatedMealTemplates.{{i}}.carbohydrates"
        />
        <app-number-input
          label="Fat"
          formCtrlName="autoCreatedMealTemplates.{{i}}.fat"
        />
        <button
          (click)="onMealTemplateRemove$.next(i)"
          title="Delete serving unit"
          class="bg-red-200 text-red-700 block rounded-full px-3 py-0 pb-1 text-bold text-3xl active:bg-red-300 transition-all active:scale-95"
          type="button"
        >-</button>
      </div>
      <button
        (click)="onMealTemplateAdd$.next()"
        title="Add serving unit"
        class="bg-green-200 text-green-700 block rounded-full px-4 py-2 text-bold text-sm active:bg-green-300 transition-all active:scale-95"
        type="button"
      >Add another meal template</button>
    </div>


    <app-submit-button class="block mt-5" label="Save"></app-submit-button>
  </form>

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
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TextInputComponent,
        NumberInputComponent,
        SubmitButtonComponent,
        AutocompleteInputComponent,
        BeDirective,
    ],
    providers: [RxState, RxEffects],
})
export class AccountDetailComponent {
  trackByIndex = trackByIndex;

  authService = inject(AuthService);
  fb = inject(NonNullableFormBuilder);
  router = inject(Router);
  state: RxState<{
    settings: Wrapped<AccountSettings>;
    saveResponse: Wrapped<any>;
    mealTemplates: Omit<MealTemplate, 'id'>[];
    logoutResponse: Wrapped<any>;
  }> = inject(RxState);
  effects = inject(RxEffects);

  onSubmit = new Subject<void>();
  onMealTemplateAdd$ = new Subject<void>();
  onMealTemplateRemove$ = new Subject<number>();
  onLogout = new Subject<void>();

  form = this.fb.group({
    dailyTargetCalories: this.fb.control(0),
    dailyTargetProtein: this.fb.control(0),
    dailyTargetCarbohydrates: this.fb.control(0),
    dailyTargetFat: this.fb.control(0),
    autoCreatedMealTemplates: this.fb.array<Omit<MealTemplate, 'id'>>([]),
  }, { updateOn: 'submit' });

  constructor() {
    this.state.connect(
      'saveResponse',
      this.onSubmit.pipe(
        filter(() => this.form.valid),
        switchMap(() => {
          const {
            dailyTargetCalories,
            dailyTargetCarbohydrates,
            dailyTargetProtein,
            dailyTargetFat,
            autoCreatedMealTemplates
          } = this.form.getRawValue();

          const req: PostAccountSettingsRequest = {
            dailyTargetCalories: dailyTargetCalories,
            dailyTargetCarbohydrates: dailyTargetCarbohydrates,
            dailyTargetProtein: dailyTargetProtein,
            dailyTargetFat: dailyTargetFat,
            autoCreatedMealTemplates: autoCreatedMealTemplates,
          };

          return this.authService.postSettings$(req).pipe(
            tap((settings) => {
              // @TODO instead, invalidate settings and re-query
              this.authService.setSettings$.next(settings);
            }),
            wrap(),
          );
        }),
      )
    );

    const autoCreatedMealTemplatesCtrl = this.form.get('autoCreatedMealTemplates') as FormArray;

    this.effects.register(this.onMealTemplateAdd$.pipe(
      tap(() => {
        const newControl = this.fb.group({
          name: this.fb.control('', [requiredValidator]),
          order: this.fb.control(0, [requiredValidator]),
          calories: this.fb.control(0, [requiredValidator]),
          protein: this.fb.control(0, [requiredValidator]),
          carbohydrates: this.fb.control(0, [requiredValidator]),
          fat: this.fb.control(0, [requiredValidator]),
        });
        autoCreatedMealTemplatesCtrl.push(newControl);
      }),
    ));

    this.effects.register(this.onMealTemplateRemove$.pipe(
      tap((index) => {
        autoCreatedMealTemplatesCtrl.removeAt(index);
      }),
    ));

    this.state.connect('mealTemplates', rawValueChanges(autoCreatedMealTemplatesCtrl, true));

    this.state.connect('settings', this.authService.settings$.pipe(
      take(1), // @TODO make this more robust I guess
      wrap(),
      tap((response) => {
        if (response.data) {
          const formArray = this.form.get('autoCreatedMealTemplates') as FormArray;
          for (const _ of response.data.autoCreatedMealTemplates) {
            const newControl = this.createNewMealTemplateFormGroup();
            formArray.push(newControl, { emitEvent: false });
          }

          this.form.setValue({
            dailyTargetCalories: response.data.dailyTargetCalories,
            dailyTargetCarbohydrates: response.data.dailyTargetCarbohydrates,
            dailyTargetProtein: response.data.dailyTargetProtein,
            dailyTargetFat: response.data.dailyTargetFat,
            autoCreatedMealTemplates: response.data.autoCreatedMealTemplates.map(template => {
              return {
                name: template.name,
                order: template.order,
                calories: template.calories,
                protein: template.protein,
                carbohydrates: template.carbohydrates,
                fat: template.fat,
              };
            }),
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

  createNewMealTemplateFormGroup() {
    const newControl = this.fb.group({
      name: this.fb.control('', [requiredValidator]),
      order: this.fb.control(0, [requiredValidator]),
      calories: this.fb.control(0, [requiredValidator]),
      protein: this.fb.control(0, [requiredValidator]),
      carbohydrates: this.fb.control(0, [requiredValidator]),
      fat: this.fb.control(0, [requiredValidator]),
    });
    return newControl;
  }

}
