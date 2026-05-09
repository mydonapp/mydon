import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-base-toggle',
  templateUrl: './base-toggle.html',
  imports: [],
})
export class BaseToggleComponent {
  value = input(false);
  size = input<'xs' | 'sm' | 'md' | 'lg'>('md');
  variant = input<'default' | 'primary' | 'success' | 'warning' | 'error'>(
    'primary',
  );

  valueChange = output<boolean>();

  onChange(event: Event) {
    this.valueChange.emit((event.target as HTMLInputElement).checked);
  }

  toggleClasses(): string {
    const sizes = {
      xs: 'toggle-xs',
      sm: 'toggle-sm',
      md: '',
      lg: 'toggle-lg',
    };
    const variants = {
      default: '',
      primary: 'toggle-primary',
      success: 'toggle-success',
      warning: 'toggle-warning',
      error: 'toggle-error',
    };
    return ['toggle', sizes[this.size()], variants[this.variant()]]
      .filter(Boolean)
      .join(' ');
  }
}
