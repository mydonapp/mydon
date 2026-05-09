import { Directive, ElementRef, inject } from '@angular/core';
import { FIELD_TOKEN } from './field.token';

@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: {
    'class': 'input',
    '[class.input-error]': 'field?.hasError() ?? false',
  },
})
export class InputDirective {
  readonly el    = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);
  readonly field = inject(FIELD_TOKEN, { optional: true });
}
