import { ChangeDetectionStrategy, Component, ElementRef, inject, Input, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-label-checkbox',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: LabelCheckboxComponent,
      multi: true,
    },
  ],
  template: `
<input
  #checkboxInput
  type="checkbox"
  id="{{checkboxId}}"
  value="true"
  [formControl]="formCtrl"
  (focus)="setFocus(true)"
  (blur)="setFocus(false)"
/>
<label for="{{checkboxId}}">
  <ng-container *ngTemplateOutlet="template; context: (context$ | async)"></ng-container>
</label>
  `,


  styles: [`
input[type="checkbox"]:not(:checked), 
input[type="checkbox"]:checked {
  position: absolute;
  left: -9999%;
}

input[type="checkbox"] + label {
  display: inline-block;
  padding: 5px;
  cursor: pointer;
  color: #0F1B31;
  background-color: #E8F2F8;
  width: 3rem;
  height: 3rem;
  border-radius: 100%;
  transition-property: background-color, transform, color;
  transition-duration: 0.1s;
  transition-timing-function: ease-in-out;
  transform: scale(1);
}

input[type="checkbox"]:checked + label {
  color: white;
  background-color: #62738C;
}

input[type="checkbox"]:focus-visible + label {
  outline: 2px solid #15539E;
}


input[type="checkbox"]:active + label {
  transform: scale(0.95);
  background-color: #D4E2F0;
}

input[type="checkbox"]:checked:active + label {
  transform: scale(0.95);
  background-color: #45586E;
}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelCheckboxComponent implements ControlValueAccessor {
  fb = inject(NonNullableFormBuilder);

  @Input() template!: TemplateRef<LabelCheckboxContext>;

  @ViewChild('checkboxInput', { read: ElementRef }) checkboxInput!: ElementRef<HTMLInputElement>;

  checkboxId = crypto.randomUUID();

  formCtrl = this.fb.control(false);

  context$ = new BehaviorSubject<LabelCheckboxContext>({ focused: false, checked: false });

  constructor() {
    this.formCtrl.valueChanges.subscribe(checked => {
      this.context$.next({
        ...this.context$.value,
        checked,
      });
      this.onChange(checked);
    });
  }

  protected setFocus(focused: boolean): void {
    this.context$.next({
      ...this.context$.value,
      focused,
    });
  }

  // ### CVA ###
  writeValue(checked: boolean): void {
    this.formCtrl.setValue(checked, { emitEvent: false });
    this.context$.next({
      ...this.context$.value,
      checked,
    });
  }

  onChange: (value: boolean) => void = () => {};
  registerOnChange(fn: typeof this.onChange): void {
    this.onChange = fn;
  }
  onTouch: () => void = () => {};
  registerOnTouched(fn: typeof this.onTouch): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // @TODO Setup disabled state + styling
    // this.state.set({ disabled: isDisabled });
  }
  // ### CVA ###
}

type LabelCheckboxContext = {
  focused: boolean;
  checked: boolean;
}
