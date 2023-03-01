import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormControl, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { map, combineLatest, startWith } from 'rxjs';
import { OverlayModule } from '@angular/cdk/overlay';
import { AutocompleteComponent } from "./autocomplete/autocomplete.component";
import { OptionComponent } from "./autocomplete/app-option.component";
import { AutocompleteDirective } from './autocomplete/autocomplete.directive';
import { AutocompleteContentDirective } from './autocomplete/autocomplete-content.directive';
import { requiredValidator } from '../util/has-gram-validator';
import { describeStore } from 'src/app/_shared/util/describe-store';
import { BeDirective } from 'src/app/_shared/directives/let.directive';

const { provideStore, injectStore } = describeStore<{
  customError?: string,
  error?: string,
  focused: boolean,
  required: boolean,
  autocompleteOptions: { label: string, value: any }[],
}>({
  focused: false,
  required: false,
  autocompleteOptions: [],
});

@Component({
    selector: 'app-autocomplete-input',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
      { provide: ControlContainer, useExisting: FormGroupDirective },
      provideStore(),
    ],
    template: `
<div *appBe="state.select() | async as vm" class="relative pb-6 flex flex-col items-start">

  <label
    *ngIf="label && showLabel"
    for="{{ label }}"
    class="text-sm text-gray-600 mb-1"
  >
    {{ label }} <span class="text-orange-500" *ngIf="vm?.required">*</span>
  </label>

  <div class="flex w-full">
    <input
      type="{{ type }}"
      id="{{ label }}"
      placeholder="{{ placeholder }}"
      [formControl]="ctrl"
      class="bg-white border-2 rounded-md px-3 py-5 h-8 w-full text-gray-900 focus:outline focus:outline-2 focus:outline-gray-500"
      [ngClass]="{ 'border-red-500 focus:outline-red-200 focus:outline-4': vm?.error }"
      (focus)="state.set({ focused: true })"
      (blur)="state.set({ focused: false })"
      [appAutocomplete]="autocomplete"
    />

    <app-autocomplete #autocomplete="appAutocomplete">
      <ng-template appAutocompleteContent>
        <app-option *ngFor="let option of vm?.autocompleteOptions" [option]="option">
          <div>{{ option.label }}</div>
        </app-option>
      </ng-template>
    </app-autocomplete>

    <p *ngIf="postfixLabel" class="mt-2 ml-2">{{ postfixLabel }}</p>
  </div>

  <p
    *ngIf="vm && vm?.error"
    class="text-red-500 absolute -bottom-0 left-0 text-sm text-ellipsis overflow-hidden whitespace-nowrap max-w-full z-10 hover:[box-shadow:10px_0_5px_#f3f4f6] hover:max-w-none hover:bg-gray-100 hover:z-10"
    [ngClass]="{ '[box-shadow:10px_0_5px_#f3f4f6] max-w-none bg-gray-100 z-10': vm?.focused }"
  >
    {{ vm.error }}
  </p>
</div>
  `,
    imports: [CommonModule, ReactiveFormsModule, OverlayModule,
      AutocompleteComponent, OptionComponent, AutocompleteDirective,
      AutocompleteContentDirective, BeDirective],
})
export class AutocompleteInputComponent implements OnInit {
  protected readonly parent = inject(FormGroupDirective, { optional: true });
  protected readonly state = injectStore();

  @Input() ctrl!: FormControl;
  @Input() formCtrlName?: string;
  @Input() label?: string;
  @Input() type: string = 'text';
  @Input() placeholder?: string;
  @Input() postfixLabel?: string;
  @Input() showLabel = true;
  @Input() set customError(customError: string) {
    this.state.set({ customError });
  }
  @Input() set autocompleteOptions(autocompleteOptions: { label: string, value: any }[]) {
    this.state.set({ autocompleteOptions });
  }

  ngOnInit(): void {
    if (this.formCtrlName && this.parent && !this.ctrl) {
      this.ctrl = this.parent.form.get(this.formCtrlName) as FormControl;
    } else if (!this.ctrl) {
      console.error('You must either formCtrlName or formCtrl input');
    }
    this.state.set({ required: this.ctrl.hasValidator(requiredValidator) });

    this.state.connect('error', combineLatest([
      this.state.select('customError').pipe(startWith(undefined)),
      this.ctrl.statusChanges,
    ]).pipe(
      map(([customError]) => {
        const validationError = Object.values(this.ctrl.errors ?? {})[0];
        return validationError ?? customError;
      }),
    ));
  }
}

