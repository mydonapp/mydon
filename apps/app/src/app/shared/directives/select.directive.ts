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
    class: 'select',
    '[class.input-error]': 'field?.hasError() ?? false',
    '[attr.aria-invalid]': 'field?.hasError() ? true : null',
    '[attr.aria-required]': 'field?.required() ? true : null',
    '[attr.aria-describedby]': 'field?.describedById() || null',
  },
})
export class SelectDirective {
  readonly el = inject(ElementRef<HTMLSelectElement>);
  readonly field = inject(FIELD_TOKEN, { optional: true });
}
