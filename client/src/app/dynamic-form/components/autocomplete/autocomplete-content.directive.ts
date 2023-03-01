import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appAutocompleteContent]',
  standalone: true,
})
export class AutocompleteContentDirective {
  constructor(public tpl: TemplateRef<any>) {}
}
