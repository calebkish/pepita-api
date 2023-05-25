import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NumberInputComponent } from './number-input.component';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { EMPTY, tap } from 'rxjs';

@Component({
  selector: 'app-range-input',
  standalone: true,
  imports: [CommonModule, NumberInputComponent, ReactiveFormsModule],
  providers: [
    RxState,
    RxEffects,
    // {
    //   provide: NG_VALUE_ACCESSOR,
    //   useExisting: RangeInputComponent,
    //   multi: true,
    // },
  ],
  template: `
<div class="relative pb-6 flex flex-col items-start">

  <label
    *ngIf="label"
    for="{{inputId}}"
    class="text-sm text-gray-600 mb-1"
  >
    {{ label }}
  </label>

  <div class="flex gap-3 items-center w-full">
    <app-number-input
      [ctrl]="numInputCtrl"
      class="[max-width:4rem] shink relative -mb-6"
      (blur)="onTouch()"
    />
    <input
      type="range"
      id="{{inputId}}"
      [step]="step"
      [min]="min"
      [max]="max"
      [formControl]="rangeCtrl"
      class="accent-slate-500 grow"
      (blur)="onTouch()"
    />
  </div>

  <!-- <p -->
  <!--   *ngIf="vm?.error as error" -->
  <!--   class="text-red-500 absolute -bottom-0 left-0 text-sm text-ellipsis overflow-hidden whitespace-nowrap max-w-full z-10 hover:[box-shadow:10px_0_5px_inherit] hover:max-w-none hover:inherit hover:z-10" -->
  <!--   [ngClass]="{ '[box-shadow:10px_0_5px_inherit] max-w-none inherit z-10': vm?.focused }" -->
  <!-- > -->
  <!--   {{ error }} -->
  <!-- </p> -->
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeInputComponent implements ControlValueAccessor {
  ngControl = inject(NgControl, { optional: true, self: true });
  fb = inject(NonNullableFormBuilder);
  effects = inject(RxEffects);
  state: RxState<{
    // customError?: string,
    // error?: string,
    disabled: boolean,
  }> = inject(RxState);

  inputId = crypto.randomUUID();
  rangeCtrl = this.fb.control(1);
  numInputCtrl = this.fb.control(1);

  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() step: number | 'any' = 0.1;
  @Input() min = 0;
  @Input() max = 5;
  // @Input() set customError(customError: string | undefined) {
  //   this.state.set({ customError });
  // }

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    this.effects.register((this.ngControl?.statusChanges ?? EMPTY).pipe(
      tap(() => {
        // @TODO implement validators + errors
        console.log(this.ngControl!.errors);
      }),
    ));

    this.state.set({ disabled: false });

    this.effects.register(this.rangeCtrl.valueChanges.pipe(
      tap(val => {
        this.numInputCtrl.setValue(val, { emitModelToViewChange: true, emitEvent: false });
        this.onChange(val);
      }),
    ));

    this.effects.register(this.numInputCtrl.valueChanges.pipe(
      tap(val => {
        this.rangeCtrl.setValue(val, { emitModelToViewChange: true, emitEvent: false });
        this.onChange(val);
      }),
    ));
  }

  // ### CVA ###
  writeValue(value: number): void {
    this.rangeCtrl.setValue(value, { emitEvent: false });
    this.numInputCtrl.setValue(value, { emitEvent: false });
  }

  onChange: (value: number) => void = () => {};
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  onTouch: () => void = () => {};
  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.state.set({ disabled: isDisabled });
    if (isDisabled) {
      this.rangeCtrl.disable();
      this.numInputCtrl.disable();
    } else {
      this.rangeCtrl.enable();
      this.numInputCtrl.enable();
    }
  }
  // ### CVA ###
}
