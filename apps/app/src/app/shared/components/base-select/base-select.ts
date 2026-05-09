import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-base-select',
  templateUrl: './base-select.html',
  imports: [FormsModule],
})
export class BaseSelectComponent {
  value = input<string>('');
  options = input<SelectOption[]>([]);
  label = input<string>('');
  placeholder = input<string>('');
  disabled = input(false);
  required = input(false);
  error = input<string>('');

  valueChange = output<string>();

  selectClasses(): string {
    const base = 'select select-bordered w-full bg-primary text-primary border-primary';
    return this.error() ? `${base} select-error` : base;
  }
}
