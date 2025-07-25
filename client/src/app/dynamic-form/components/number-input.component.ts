import { ChangeDetectionStrategy, Component, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormControl, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { map, combineLatest, startWith, Subject } from 'rxjs';
import { requiredValidator } from '../util/has-gram-validator';
import { BeDirective } from 'src/app/_shared/directives/let.directive';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BeDirective],
  providers: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
    RxState,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="relative pb-6 flex flex-col items-start" *appBe="state.select() | async as vm">

  <label
    *ngIf="label && showLabel"
    for="{{ label }}"
    class="text-sm text-gray-600 mb-1"
  >
    {{ label }} <span class="text-orange-500" *ngIf="vm?.required">*</span>
  </label>

  <div class="flex w-full">
    <input
      type="number"
      id="{{ label }}"
      placeholder="{{ placeholder }}"
      [formControl]="ctrl"
      class="bg-white border-2 rounded-md px-3 py-2 h-auto w-full text-gray-900 focus:outline focus:outline-2 focus:outline-gray-500"
      (focus)="state.set({ focused: true })"
      (blur)="state.set({ focused: false }); blur$.next()"
      [ngClass]="{
        'border-red-500 focus:outline-red-200 focus:outline-4': vm?.error,
        'bg-slate-300 [cursor:not-allowed]': vm?.disabled
      }"
    />
    <p *ngIf="postfixLabel" class="mt-2 ml-2">{{ postfixLabel }}</p>
  </div>

  <p
    *ngIf="vm?.error as error"
    class="text-red-500 absolute -bottom-0 left-0 text-sm text-ellipsis overflow-hidden whitespace-nowrap max-w-full z-10 hover:[box-shadow:10px_0_5px_inherit] hover:max-w-none hover:inherit hover:z-10"
    [ngClass]="{ '[box-shadow:10px_0_5px_inherit] max-w-none inherit z-10': vm?.focused }"
  >
    {{ error }}
  </p>
</div>
  `,
  styles: [`
input[type=number]{
  -moz-appearance: textfield;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
  `]
})
export class NumberInputComponent {
  parent = inject(FormGroupDirective);
  protected readonly state: RxState<{
    customError: string,
    error?: string,
    focused: boolean,
    required: boolean,
    disabled: boolean,
  }> = inject(RxState);

  blur$ = new Subject<void>();

  @Input() ctrl!: FormControl;
  @Input() formCtrlName?: string;
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() postfixLabel?: string;
  @Input() showLabel = true;
  @Input() set customError(customError: string | undefined) {
    this.state.set({ customError });
  }

  @Input() set disabled(disabled: boolean) {
    this.ctrlCheck();
    disabled
      ? this.ctrl.disable()
      : this.ctrl.enable();
  }

  @Output() blur = this.blur$.asObservable();

  constructor() {
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

        const validationError = Object.values(this.ctrl.errors ?? {})[0];
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
