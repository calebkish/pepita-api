import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, FormControl  } from '@angular/forms';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { TextAreaInputComponent } from '../dynamic-form/components/text-area-input.component';
import { trackByIndexValue } from '../_shared/util/track-by-index-value';
import { rawValueChanges } from '../dynamic-form/util/raw-value-changes';
import { requiredValidator } from "src/app/dynamic-form/util/has-gram-validator";
import { StoreLocation } from '../_shared/services/shopping-list.service';
import { TextInputComponent } from "../dynamic-form/components/text-input.component";

export type StoreLocationCtrl = ReturnType<typeof StoreLocationFormComponent.createStoreLocationControl>;


@Component({
    selector: 'app-store-location-form',
    standalone: true,
    providers: [RxState, RxEffects],
    template: `
<ng-container [formGroup]="parent" *appBe="state.select() | async as vm">
  <div class="flex flex-col">
    <div *ngFor="let location of vm?.locations ?? []; index as i; trackBy: trackByIndexValue" class="flex items-start gap-3">
      <app-text-input
        label="Location"
        formCtrlName="locations.{{i}}"
        [showLabel]="false"
        class="w-full"
        [disabled]="!!vm?.readonly"
      />

      <button
        *ngIf="!vm?.readonly"
        type="button"
        (click)="onLocationRemove$.next(i)"
        title="Delete location"
        class="bg-red-200 text-red-700 block rounded-full px-3 py-0 pb-1 text-bold text-3xl active:bg-red-300 transition-all active:scale-95"
      >
        -
      </button>
    </div>

    <button
      *ngIf="!vm?.readonly"
      (click)="onLocationAdd$.next()"
      class="bg-green-200 text-green-700 block rounded-full px-4 py-2 text-bold text-sm active:bg-green-300 transition-all active:scale-95 w-fit"
      type="button"
    >
      Add location
    </button>
  </div>
</ng-container>
  `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TextAreaInputComponent, ReactiveFormsModule, BeDirective, TextInputComponent]
})
export class StoreLocationFormComponent {
  static createStoreLocationControl() {
    return new FormControl<StoreLocation['name']>(
      '',
      { nonNullable: true, validators: [requiredValidator] }
    );
  }

  fb = inject(NonNullableFormBuilder);
  state: RxState<{
    locations: string[],
    readonly: boolean,
  }> = inject(RxState);
  effects = inject(RxEffects);

  @Input() set readonly(readonly: boolean) {
    this.state.set({ readonly });
  }
  @Input() parent!: FormGroup;

  // Actions
  onLocationAdd$ = new Subject<void>();
  onLocationRemove$ = new Subject<number>();

  trackByIndexValue = trackByIndexValue;

  ngOnInit(): void {
    this.parent.addControl('locations', this.fb.array<StoreLocationCtrl>([]));

    const storeLocationsFormArray = this.parent.get('locations') as FormArray<StoreLocationCtrl>;
    this.state.connect('locations', rawValueChanges(storeLocationsFormArray!, true));

    this.effects.register(this.onLocationAdd$, () => {
      const newControl = StoreLocationFormComponent.createStoreLocationControl();
      storeLocationsFormArray.push(newControl);
    });
    this.effects.register(this.onLocationRemove$, (index) => {
      storeLocationsFormArray.removeAt(index);
    });
  }
}
