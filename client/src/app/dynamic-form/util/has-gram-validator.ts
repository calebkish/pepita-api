import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";

export function customValidator(name: string, message: string, getIsValid: (control: AbstractControl) => boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isValid = getIsValid(control);
    return isValid ? { [name]: message } : null;
  };
}

export const isEmailValidator = customValidator('isEmail', 'Not a valid email', (control) => {
  return !!Validators.email(control);
});

export const requiredValidator = customValidator('required', 'Required', (control) => {
  return !!Validators.required(control);
});


export const isNotNumberValidator = customValidator('isNotNumber', 'Must be a positive number', (control) => {
  if (control.value === null) {
    return false;
  }
  if (control.value.length === 0) {
    return false;
  }
  const isNumberPattern = /^[0-9]+\.?[0-9]*$/;
  const isNumber = isNumberPattern.test(control.value);
  return !isNumber;
});
