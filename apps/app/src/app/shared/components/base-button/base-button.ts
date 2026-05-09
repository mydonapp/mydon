import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'ghost'
  | 'link'
  | 'borderless';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-base-button',
  templateUrl: './base-button.html',
  imports: [RouterLink],
})
export class BaseButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input(false);
  loading = input(false);
  hideLoadingSpinner = input(false);
  tag = input<'button' | 'router-link' | 'a'>('button');
  routerLinkPath = input<string | any[]>('');
  href = input<string>('');
  block = input(false);
  rounded = input(false);

  clicked = output<MouseEvent>();

  buttonClasses(): string {
    const base = 'btn inline-flex items-center justify-center font-medium transition-all duration-200';
    const variants: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      success: 'btn-success',
      danger: 'btn-error',
      warning: 'btn-warning',
      info: 'btn-info',
      ghost: 'btn-ghost',
      link: 'btn-link',
      borderless: 'border-0 bg-transparent hover:bg-primary/10',
    };
    const sizes: Record<ButtonSize, string> = {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
      xl: 'btn-xl',
    };

    const classes = [
      base,
      variants[this.variant()],
      sizes[this.size()],
      this.block() ? 'w-full' : '',
      this.rounded() ? 'rounded-full' : 'rounded-lg',
    ]
      .filter(Boolean)
      .join(' ');

    return classes;
  }
}
