import { Directive, ElementRef, inject } from '@angular/core';
import { FIELD_TOKEN } from './field.token';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Directive({
  selector: 'select[appSelect]',
  host: {
    'class': 'select',
    '[class.input-error]': 'field?.hasError() ?? false',
  },
})
export class SelectDirective {
  readonly el    = inject(ElementRef<HTMLSelectElement>);
  readonly field = inject(FIELD_TOKEN, { optional: true });
}
