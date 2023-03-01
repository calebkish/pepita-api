import { Pipe, PipeTransform } from '@angular/core';
import { FormControl, FormGroupDirective } from '@angular/forms';

@Pipe({
  name: 'grpCtrl',
  pure: true,
  standalone: true,
})
export class CtrlInGroupPipe implements PipeTransform {

  constructor(private controlContainer: FormGroupDirective) {}

  transform(value: string): FormControl {
    const control = this.controlContainer.form.get(value) as FormControl;
    return control;
  }

}
