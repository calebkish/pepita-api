import { ChangeDetectionStrategy, Component, ElementRef, inject, Input, TrackByFunction, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { RxEffects } from '@rx-angular/state/effects';
import { RxState } from '@rx-angular/state';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { LabelCheckboxComponent } from './label-checkbox.component';
import { combineLatest, debounceTime, map, merge, startWith, tap, throwError } from 'rxjs';
import { OverlayModule } from '@angular/cdk/overlay';
import { FractionalStepsOverlayComponent } from "./fractional-steps-overlay.component";
import { FoodOnRecipe } from 'src/app/_shared/models/recipe';

export interface FractionalValue {
  scaleBase: FoodOnRecipe['scaleBase'];
  scaleNumerator: FoodOnRecipe['scaleNumerator'];
  scaleDenominator: FoodOnRecipe['scaleDenominator'];
  scaleDecimal: FoodOnRecipe['scaleDecimal'];
  shouldUseScaleDecimal: FoodOnRecipe['shouldUseScaleDecimal'];
  halves: FoodOnRecipe['halves'];
  thirds: FoodOnRecipe['thirds'];
  fourths: FoodOnRecipe['fourths'];
  sixths: FoodOnRecipe['sixths'];
  eighths: FoodOnRecipe['eighths'];
  sixteenths: FoodOnRecipe['sixteenths'];
}

type FractionOption = { scaleNumerator: number, scaleDenominator: number };

const validateFractionalControl: ValidatorFn = (control) => {
  const value = control.getRawValue();

  if (value.shouldUseScaleDecimal && value.scaleDecimal === 0) {
    return { 'fractional': 'Required' };
  } else if (
    !value.shouldUseScaleDecimal &&
    (value.scaleBase ?? 0 + (value.scaleNumerator / value.scaleDenominator)) === 0
  ) {
    return { 'fractional' : 'Required' };
  }
  return null;
}

@Component({
    selector: 'app-fractional-input',
    standalone: true,
    templateUrl: './fractional-input.component.html',
    styles: [`
input[type=number] {
  -moz-appearance: textfield;
}
input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [RxState, RxEffects],
    imports: [CommonModule, BeDirective, ReactiveFormsModule, LabelCheckboxComponent, OverlayModule, FractionalStepsOverlayComponent]
})
export class FractionalInputComponent implements ControlValueAccessor {
  fb = inject(NonNullableFormBuilder);
  ctrl = inject(NgControl, { self: true });

  effects = inject(RxEffects);
  state: RxState<{
    customError: string,
    error?: string,
    focused: boolean,
    required: boolean,
    disabled: boolean,
    shouldUseScaleDecimal: boolean,
    fractionOptions: FractionOption[],
  }> = inject(RxState);

  form = this.fb.group({
    scaleDecimal: this.fb.control<number | null>(1),
    scaleBase: this.fb.control<number | null>(1),
    fraction: this.fb.control<FractionOption>({ scaleNumerator: 1, scaleDenominator: 1 }),
    shouldUseScaleDecimal: false,
    halves: false,
    thirds: false,
    fourths: false,
    sixths: false,
    eighths: false,
    sixteenths: false,
  });

  trackByFractionOption: TrackByFunction<FractionOption> = (_, option) => String(option.scaleNumerator) + String(option.scaleDenominator);

  // @TODO why is this running so much?
  compareWithFractionOption = (a: FractionOption, b: FractionOption) => {
    const aValue = a.scaleNumerator / a.scaleDenominator;
    const bValue = b.scaleNumerator / b.scaleDenominator;
    return aValue === bValue;
  };

  @ViewChild('baseInput', { read: ElementRef }) baseInput!: ElementRef<HTMLInputElement>;
  @ViewChild('decimalInput', { read: ElementRef }) decimalInput!: ElementRef<HTMLInputElement>;

  @Input() label?: string;

  // Optional
  @Input() showLabel = true;
  @Input() disableScaleChanging = false;
  @Input() set customError(customError: string) {
    this.state.set({ customError });
  }

  constructor() {
    this.ctrl.valueAccessor = this;

    this.state.set({
      disabled: false,
      required: false,
      focused: false,
      shouldUseScaleDecimal: false,
    });

    const stepChange$ = merge(
      this.form.controls.halves.valueChanges,
      this.form.controls.thirds.valueChanges,
      this.form.controls.fourths.valueChanges,
      this.form.controls.sixths.valueChanges,
      this.form.controls.eighths.valueChanges,
      this.form.controls.sixteenths.valueChanges,
    ).pipe(debounceTime(1));

    this.effects.register(stepChange$.pipe(
      tap(() => {
        const value = this.form.getRawValue();
        const fractionOptions = getFractionStepDropdownOptions(value);

        const currentFractionValue = value.fraction.scaleNumerator / value.fraction.scaleDenominator;

        let matchingOption: FractionOption = { scaleNumerator: 0, scaleDenominator: 1 };
        for (const option of fractionOptions) {
          const optionValue = option.scaleNumerator / option.scaleDenominator;
          if (currentFractionValue === optionValue) {
            matchingOption = option;
            break;
          }
        }

        // Set local state...
        this.state.set({ fractionOptions });
        this.form.controls.fraction.setValue(matchingOption, { emitEvent: false });

        // Output the state
        this.onChange({
          scaleDecimal: value.scaleDecimal ?? 0,
          scaleBase: value.scaleBase ?? 0,
          shouldUseScaleDecimal: value.shouldUseScaleDecimal,
          scaleNumerator: value.fraction.scaleNumerator,
          scaleDenominator: value.fraction.scaleDenominator,
          halves: value.halves,
          thirds: value.thirds,
          fourths: value.fourths,
          sixths: value.sixths,
          eighths: value.eighths,
          sixteenths: value.sixteenths,
        });
        this.onTouch(); // this needs to go after onChange for some reason
      }),
    ));

    const otherChange$ = merge(
      this.form.controls.shouldUseScaleDecimal.valueChanges,
      this.form.controls.scaleBase.valueChanges,
      this.form.controls.fraction.valueChanges,
      this.form.controls.scaleDecimal.valueChanges,
    ).pipe(debounceTime(1));

    this.effects.register(otherChange$.pipe(
      tap(() => {
        const value = this.form.getRawValue();

        this.onChange({
          scaleDecimal: value.scaleDecimal ?? 0,
          scaleBase: value.scaleBase ?? 0,
          shouldUseScaleDecimal: value.shouldUseScaleDecimal,
          scaleNumerator: value.fraction.scaleNumerator,
          scaleDenominator: value.fraction.scaleDenominator,
          halves: value.halves,
          thirds: value.thirds,
          fourths: value.fourths,
          sixths: value.sixths,
          eighths: value.eighths,
          sixteenths: value.sixteenths,
        });
        this.onTouch(); // this needs to go after onChange for some reason
      }),
    ));

    this.state.connect('shouldUseScaleDecimal', this.form.controls.shouldUseScaleDecimal.valueChanges.pipe(
      tap(() => {
        this.ctrl.control?.updateValueAndValidity();
      }),
    ));

    this.effects.register(this.state.select('disabled').pipe(
      tap((disabled) => {
        if (disabled) {
          this.form.disable();
        } else {
          this.form.enable();
        }
      }),
    ));
  }

  ngOnInit() {
    // `this.ctrl.control` will only exist here

    this.ctrl.control?.addValidators(validateFractionalControl);

    this.state.connect('error', combineLatest([
      this.state.select('customError').pipe(startWith(undefined)),
      this.ctrl.control?.statusChanges ?? throwError(() => new Error('statusChanges does not exist on fractional input control')),
    ]).pipe(
      map(([customError, status]) => {
        this.state.set({ disabled: this.ctrl.disabled ?? false });

        if (!this.ctrl.touched) return undefined;

        const validationError = Object.values(this.ctrl.errors ?? {})[0];
        return validationError ?? customError;
      }),
    ));

    this.ctrl.control?.updateValueAndValidity();
  }

  // ### CVA ###
  writeValue(value: FractionalValue): void {
    const {
      scaleBase, scaleNumerator, scaleDenominator, scaleDecimal,
      shouldUseScaleDecimal, halves, thirds, fourths, sixths, eighths,
      sixteenths
    } = value;
    this.state.set({ shouldUseScaleDecimal });
    this.form.setValue({
      shouldUseScaleDecimal,
      scaleDecimal: scaleDecimal === 0 ? null : scaleDecimal,
      scaleBase: scaleBase === 0 ? null : scaleBase,
      fraction: { scaleNumerator, scaleDenominator },
      halves,
      thirds,
      fourths,
      sixths,
      eighths,
      sixteenths,
    }, { emitEvent: false });
    const fractionOptions = getFractionStepDropdownOptions(value);
    this.state.set({ fractionOptions });
  }

  onChange: (obj: FractionalValue) => void = () => {};
  registerOnChange(fn: (obj: FractionalValue) => void): void {
    this.onChange = fn;
  }
  onTouch: () => void = () => {};
  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.state.set({ disabled: isDisabled });
  }
  // ### CVA ###
}


export const mockFractionalValue: FractionalValue = {
  scaleBase: 1,
  scaleNumerator: 0,
  scaleDenominator: 1,
  scaleDecimal: 1,
  shouldUseScaleDecimal: false,
  halves: false,
  thirds: false,
  fourths: false,
  sixths: false,
  eighths: false,
  sixteenths: false,
};


export function getFractionStepDropdownOptions(steps: {
  halves: boolean,
  thirds: boolean,
  fourths: boolean,
  sixths: boolean,
  eighths: boolean,
  sixteenths: boolean,
}): FractionOption[] {
  const { halves, thirds, fourths, sixths, eighths, sixteenths } = steps;
  const getFractionOptions = (denominator: number) => {
    const opts: FractionOption[] = [];
    for (let i=1; i<denominator; i++) opts.push({ scaleNumerator: i, scaleDenominator: denominator });
    return opts;
  };

  const stepAssociations: [boolean, number][] = [
    [halves, 2],
    [thirds, 3],
    [fourths, 4],
    [sixths, 6],
    [eighths, 8],
    [sixteenths, 16],
  ];

  const options: FractionOption[] = [];
  const optionsSet = new Set<number>();
  for (const [shouldIncludeStep, step] of stepAssociations) {
    if (shouldIncludeStep) {
      getFractionOptions(step)
        .forEach(({ scaleNumerator, scaleDenominator }) => {
          const value = scaleNumerator / scaleDenominator;
          if (optionsSet.has(value)) return;
          options.push({ scaleNumerator, scaleDenominator });
          optionsSet.add(value);
        });
    }
  }
  const sorted = options
    .concat([{ scaleNumerator: 0, scaleDenominator: 1 }])
    .sort((a, b) => {
      const aValue = a.scaleNumerator / a.scaleDenominator;
      const bValue = b.scaleNumerator / b.scaleDenominator;
      return aValue - bValue;
    });
  return sorted;
}
