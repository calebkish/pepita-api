import { FormControl, FormGroup } from '@angular/forms';

export function getFormGroupErrors(formGroup: FormGroup): Record<string, any> {
  const data: Record<string, any> = {};
  Object.keys(formGroup.controls).forEach((field) => {
    const control = formGroup.get(field);
    if (control instanceof FormControl) {
      const validatorName = Object.keys(control.errors ?? {})[0];
      const message = getFormControlValidationMessage(validatorName);
      data[field] = message;
    } else if (control instanceof FormGroup) {
      data[field] = getFormGroupErrors(control);
    }
  });
  return data;
}

export function getFormControlValidationMessage(validatorName: string): string | null {
  switch (validatorName) {
    case 'required':
      return 'Cannot be empty';
    case 'email':
      return 'Provided email is not valid';
    default:
      return null;
  }
}
