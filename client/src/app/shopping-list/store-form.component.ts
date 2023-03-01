import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubmitButtonComponent } from "../dynamic-form/components/submit-button.component";
import { TextInputComponent } from "../dynamic-form/components/text-input.component";
import { StoreLocationCtrl, StoreLocationFormComponent } from "./store-location-form.component";
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../_shared/services/toast.service';
import { RxEffects } from '@rx-angular/state/effects';
import { RxState } from '@rx-angular/state';
import { wrap, Wrapped } from '../_shared/util/wrap';
import { EMPTY, catchError, filter, map, of, Subject, switchMap, withLatestFrom, tap } from 'rxjs';
import { PutStoreRequest, ShoppingListService, Store } from '../_shared/services/shopping-list.service';
import { requiredValidator } from '../dynamic-form/util/has-gram-validator';
import { BeDirective } from '../_shared/directives/let.directive';

type StoreFormMode = 'create' | 'edit';

@Component({
  selector: 'app-store-form',
  standalone: true,
  template: `
<div *appBe="state.select() | async as vm" class="p-5">

  <div class="grid grid-cols-12 gap-8">
    <div class="w-full col-span-7 relative pb-96">

      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-800 mb-5">
          {{ vm?.formMode === 'create' ? 'Create store': 'Edit store' }}
        </h1>

        <button
          *ngIf="vm?.formMode === 'edit'"
          (click)="onDeleteStore$.next()"
          title="Add serving unit"
          class="bg-red-200 text-red-700 rounded-full px-4 py-2 text-bold text-sm active:bg-red-300 transition-all active:scale-95 w-fit flex items-center gap-1"
          type="button"
        >
          <span class="material-symbols-outlined">delete</span>
          Delete store
        </button>
      </div>

      <form (ngSubmit)="onSubmit$.next()" [formGroup]="form">
        <div class="flex flex-col gap-3">
          <app-text-input label="Name" formCtrlName="name" />

          <div class="flex flex-col gap-3 pb-7">
            <p class="text-2xl font-bold text-slate-700">Locations</p>
            <div class="pl-4">
              <app-store-location-form [parent]="form" />
            </div>
          </div>

        </div>

        <div class="flex">
          <app-submit-button [label]="vm?.formMode === 'create' ? 'Create' : 'Apply edit'" />
        </div>

      </form>
    </div>

    <div class="col-span-5">
    </div>

  </div>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SubmitButtonComponent, TextInputComponent, StoreLocationFormComponent, ReactiveFormsModule, BeDirective],
  providers: [RxEffects, RxState],
})
export class StoreFormComponent {
  fb = inject(NonNullableFormBuilder);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);

  shoppingListService = inject(ShoppingListService);

  effects = inject(RxEffects);
  state: RxState<{
    postStoreResponse: Wrapped<any>,
    formMode: StoreFormMode,
    deleteStoreResponse: Wrapped<void>,
  }> = inject(RxState);

  // Actions
  onSubmit$ = new Subject<void>();
  onDeleteStore$ = new Subject<void>();

  form = this.fb.group<{
    name: FormControl<string>,
    locations?: FormArray<StoreLocationCtrl>,
  }>({
    name: this.fb.control<Store['name']>('', [requiredValidator]),
  }, { updateOn: 'blur' });

  constructor() {
    this.state.connect('formMode', this.activatedRoute.url, (_, urlSegments) => {
      return urlSegments[1].path === 'create' ? 'create' : 'edit';
    });

    this.state.connect('postStoreResponse', this.onSubmit$.pipe(
      withLatestFrom(this.state.select('formMode'), this.activatedRoute.params),
      switchMap(([_, formMode, params]) => {
        const val = this.form.getRawValue();
        if (!this.form.valid) {
          return of({ loading: false, error: 'Form is invalid' });
        }

        const req: PutStoreRequest = {
          name: val.name,
          locations: val.locations ?? [],
          storeId: params['storeId']
        };

        return this.shoppingListService.putStore$(req).pipe(
          wrap(),
          tap((res) => {
            if (res.loading) {
              return;
            }
            if (res.error) {
              if (formMode === 'create') {
                this.toastService.open({ message: 'Failed to create store' });
                return;
              } else if (formMode === 'edit') {
                this.toastService.open({ message: 'Failed to edit store' });
                return;
              }
            }
            if (res.data) {
              if (formMode === 'create') {
                this.toastService.open({ message: `New store "${res.data?.name}" created` });
                this.router.navigate(['shopping-lists']);
                return;
              } else if (formMode === 'edit') {
                this.toastService.open({ message: `Store "${res.data?.name}" changes saved` });
                return;
              }
            }
          }),
        );
      }),
    ));

    this.state.connect('deleteStoreResponse', this.onDeleteStore$.pipe(
      withLatestFrom(this.activatedRoute.params),
      switchMap(([_, params]) => {
        return this.shoppingListService.deleteStore$(params['storeId']).pipe(
          wrap(),
          tap(res => {
            if (res.data) {
              this.toastService.open({ message: 'Store successfully deleted' });
              this.router.navigate(['shopping-lists']);
            } else if (res.error) {
              this.toastService.open({ message: 'Failed to delete store' });
            }
          }),
        );
      }),
    ));
  }

  ngAfterViewInit(): void {
    const storeLocationsFormArray = this.form.get('locations') as FormArray<StoreLocationCtrl> | undefined;

    // Populate form with seed data
    this.effects.register(
      this.activatedRoute.params.pipe(
        map(params => params['storeId']),
      )
        .pipe(
          filter(storeId => !!storeId),
          switchMap((storeId) => {
            return this.shoppingListService.getStore$(storeId).pipe(
              catchError(() => {
                this.router.navigate(['shopping-lists']);
                return EMPTY;
              }),
            );
          }),
          withLatestFrom(this.state.select('formMode')),
          tap(([store, formMode]) => {

            // Create directions controls & populate with bullshit data...
            if (storeLocationsFormArray) {
              const toCreate = store.locations.length - storeLocationsFormArray.length;
              if (toCreate > 0) {
                for (let i=0; i<toCreate; i++) {
                  storeLocationsFormArray.push(StoreLocationFormComponent.createStoreLocationControl());
                }
              }
            }

            // ...then fill controls with real data.
            this.form.setValue({
              name: store.name,
              locations: store.locations.map(l => l.name),
            });
          }),
      ),
    );
  }

}
