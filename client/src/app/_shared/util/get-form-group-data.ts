import { FormControl, FormGroup } from '@angular/forms';

export function getFormGroupData(formGroup: FormGroup, data: any = {}): any {
  Object.keys(formGroup.controls).forEach((field) => {
    const control = formGroup.get(field);
    if (control instanceof FormControl) {
      data[field] = {
        errors: control.errors,
        pristine: control.pristine,
        touched: control.touched,
        dirty: control.dirty,
        invalid: control.invalid,
      };
    } else if (control instanceof FormGroup) {
      data[field] = getFormGroupData(control);
    }
  });
  return {
    group: {
      errors: formGroup.errors,
      pristine: formGroup.pristine,
      touched: formGroup.touched,
      dirty: formGroup.dirty,
      invalid: formGroup.invalid,
    },
    controls: data,
  };
}
