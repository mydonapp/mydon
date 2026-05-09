import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-base-input',
  templateUrl: './base-input.html',
  imports: [FormsModule],
})
export class BaseInputComponent {
  value = input<string | number>('');
  type = input<string>('text');
  label = input<string>('');
  placeholder = input<string>('');
  disabled = input(false);
  readonly = input(false);
  required = input(false);
  error = input<string>('');
  helpText = input<string>('');
  min = input<string | number>('');
  max = input<string | number>('');
  step = input<string | number>('');
  pattern = input<string>('');
  autocomplete = input<string>('');

  valueChange = output<string>();

  inputClasses(): string {
    const base = 'input input-bordered w-full bg-primary text-primary border-primary focus:border-primary-400';
    return this.error() ? `${base} input-error` : base;
  }
}
