import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormControl, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { combineLatest, map, startWith } from 'rxjs';
import { getFormControlValidationMessage } from 'src/app/_shared/util/get-form-group-errors';
import { requiredValidator } from '../util/has-gram-validator';
import { BeDirective } from 'src/app/_shared/directives/let.directive';

export type SelectOption<T> = {
  name: string;
  value: T;
}

@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BeDirective],
  providers: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
    RxState,
  ],
  template: `
<div class="relative pb-6 flex flex-col items-start" *appBe="state.select() | async as vm">

  <label
    *ngIf="label && showLabel"
    for="{{ label }}"
    class="text-sm text-gray-600 mb-1"
  >
    {{ label }} <span class="text-orange-500" *ngIf="vm?.required">*</span>
  </label>

  <select
    id="{{ label }}"
    [formControl]="ctrl"
    [compareWith]="objectComparisonFunction"
    class="bg-white px-3 py-2 [height:44px] rounded-md w-full border-2 text-gray-900 focus:outline focus:outline-2 focus:outline-gray-500"
    [ngClass]="{
      'border-red-500 focus:outline-red-200 focus:outline-4': vm?.error,
      'bg-slate-300 [cursor:not-allowed]': vm?.disabled
    }"
    (focus)="state.set({ focused: true })"
    (blur)="state.set({ focused: false })"
  >
    <option value="" selected>Select option...</option>
    <option *ngFor="let option of options" [ngValue]="option.value">{{ option.name }}</option>
  </select>

  <p
    *ngIf="vm?.error as error"
    class="text-red-500 absolute -bottom-0 left-0 text-sm text-ellipsis overflow-hidden whitespace-nowrap max-w-full z-10 hover:[box-shadow:10px_0_5px_inherit] hover:max-w-none hover:inherit hover:z-10"
    [ngClass]="{ '[box-shadow:10px_0_5px_inherit] max-w-none inherit z-10': vm?.focused }"
  >
    {{ error }}
  </p>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectInputComponent<T> implements OnInit {
  objectComparisonFunction = (a: SelectOption<T>, b: SelectOption<T>) => {
    if (b === null) {
      return false;
    }
    return a.name === b.name;
  }

  protected readonly state: RxState<{
    customError: string,
    error?: string,
    focused: boolean,
    required: boolean,
    disabled: boolean,
  }> = inject(RxState);

  @Input() ctrl!: FormControl;
  @Input() formCtrlName?: string;
  @Input() label?: string;
  @Input() postfixLabel?: string;
  @Input() showLabel = true;
  @Input() set customError(customError: string | undefined) {
    this.state.set({ customError });
  }

  @Input() options: SelectOption<T>[] = [];

  @Input() set disabled(disabled: boolean) {
    this.ctrlCheck();
    disabled
      ? this.ctrl.disable()
      : this.ctrl.enable();
  }

  constructor(protected parent: FormGroupDirective) {
    this.state.set({ focused: false, required: false });
  }

  ngOnInit(): void {
    this.ctrlCheck();

    this.state.set({ disabled: this.ctrl.disabled });
    this.state.set({ required: this.ctrl.hasValidator(requiredValidator) });

    this.state.connect('error', combineLatest([
      this.state.select('customError').pipe(startWith(undefined)),
      this.ctrl.statusChanges,
    ]).pipe(
      map(([customError]) => {
        this.state.set({ disabled: this.ctrl.disabled });

        if (!this.ctrl.touched) return undefined;

        const validatorName = Object.keys(this.ctrl.errors ?? {})[0];
        const validationError = getFormControlValidationMessage(validatorName);
        return validationError ?? customError;
      }),
    ));
  }

  ctrlCheck() {
    if (this.formCtrlName && !this.ctrl) {
      this.ctrl = this.parent.form.get(this.formCtrlName) as FormControl;
    } else if (!this.ctrl) {
      console.error('You must either formCtrlName or formCtrl input');
    }
  }
}
