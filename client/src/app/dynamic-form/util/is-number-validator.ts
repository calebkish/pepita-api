import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const isPositiveNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (typeof control.value === 'number' && control.value < 0) {
    return { isPositiveNumber: 'Must be a positive number' };
  }

  return null;
};
