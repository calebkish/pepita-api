import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { Recipe } from 'src/app/_shared/models/recipe';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, FormControl  } from '@angular/forms';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { TextAreaInputComponent } from '../dynamic-form/components/text-area-input.component';
import { trackByIndexValue } from '../_shared/util/track-by-index-value';
import { rawValueChanges } from '../dynamic-form/util/raw-value-changes';
import { requiredValidator } from "src/app/dynamic-form/util/has-gram-validator";

export type DirectionCtrl = ReturnType<typeof RecipeDirectionsComponent.createDirectionsControl>;


@Component({
    selector: 'app-recipe-directions',
    standalone: true,
    template: `
<ng-container [formGroup]="parent" *appBe="state.select() | async as vm">
  <div class="flex flex-col">
    <div *ngFor="let direction of vm?.directions ?? []; index as i; trackBy: trackByIndexValue" class="flex items-start gap-3">
      <p class="mt-3">{{i+1}}.</p>
      <app-text-area-input
        label="Direction"
        formCtrlName="directions.{{i}}"
        [showLabel]="false"
        class="w-full"
        [disabled]="!!vm?.readonly"
      ></app-text-area-input>
      <button
        *ngIf="!vm?.readonly"
        type="button"
        (click)="onDirectionRemove$.next(i)"
        title="Delete direciton"
        class="bg-red-200 text-red-700 block rounded-full px-3 py-0 pb-1 text-bold text-3xl active:bg-red-300 transition-all active:scale-95"
      >
        -
      </button>
    </div>

    <button
      *ngIf="!vm?.readonly"
      (click)="onDirectionAdd$.next()"
      class="bg-green-200 text-green-700 block rounded-full px-4 py-2 text-bold text-sm active:bg-green-300 transition-all active:scale-95 w-fit"
      type="button"
    >
      Add direction
    </button>
  </div>
</ng-container>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TextAreaInputComponent, ReactiveFormsModule, BeDirective],
    providers: [RxState, RxEffects],
})
export class RecipeDirectionsComponent {
  static createDirectionsControl() {
    return new FormControl<Recipe['directions'][number]>(
      '',
      { nonNullable: true, validators: [requiredValidator] }
    );
  }

  fb = inject(NonNullableFormBuilder);
  state: RxState<{
    directions: Recipe['directions'],
    readonly: boolean,
  }> = inject(RxState);
  effects = inject(RxEffects);

  @Input() set readonly(readonly: boolean) {
    this.state.set({ readonly });
  }
  @Input() parent!: FormGroup;

  // Actions
  onDirectionAdd$ = new Subject<void>();
  onDirectionRemove$ = new Subject<number>();

  trackByIndexValue = trackByIndexValue;

  ngOnInit(): void {
    this.parent.addControl('directions', this.fb.array<DirectionCtrl>([]));
    const directionsFormArray = this.parent.get('directions') as FormArray<DirectionCtrl>;
    this.state.connect('directions', rawValueChanges(directionsFormArray!, true));

    this.effects.register(this.onDirectionAdd$, () => {
      const newControl = RecipeDirectionsComponent.createDirectionsControl();
      directionsFormArray.push(newControl);
    });
    this.effects.register(this.onDirectionRemove$, (index) => {
      directionsFormArray.removeAt(index);
    });
  }

}
