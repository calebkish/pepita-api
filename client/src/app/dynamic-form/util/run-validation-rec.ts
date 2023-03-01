import { AbstractControl, isFormArray, isFormGroup, isFormRecord } from "@angular/forms";

// `updateValueAndValidity` doesn't actually propogate changes to children, so
// we do it manually with this function.
export function runValidationRec(controls: AbstractControl[], touch: boolean = false): void {
  for (const control of controls) {
    if (touch) control.markAsTouched();

    if (isFormArray(control)) {
      control.updateValueAndValidity({ onlySelf: true });
      runValidationRec(control.controls, touch);
    } else if (isFormGroup(control)) {
      control.updateValueAndValidity({ onlySelf: true });
      runValidationRec(Object.values(control.controls), touch);
    } else if (isFormRecord(control)) {
      control.updateValueAndValidity({ onlySelf: true });
      runValidationRec(Object.values(control.controls), touch);
    } else {
      control.updateValueAndValidity({ onlySelf: true });
    }
  }
}
