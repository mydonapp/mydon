import { Directive, input } from '@angular/core';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
export type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

@Directive({
  selector: 'button[appBtn], a[appBtn]',
  host: {
    class: 'btn',
    '[class.btn-primary]': 'variant() === "primary"',
    '[class.btn-secondary]': 'variant() === "secondary"',
    '[class.btn-ghost]': 'variant() === "ghost"',
    '[class.btn-error]': 'variant() === "danger"',
    '[class.btn-success]': 'variant() === "success"',
    '[class.btn-warning]': 'variant() === "warning"',
    '[class.btn-sm]': 'size() === "sm"',
    '[class.btn-xs]': 'size() === "xs"',
    '[class.btn-lg]': 'size() === "lg"',
    '[class.w-full]': 'block()',
    '[attr.disabled]': 'loading() || disabled() ? true : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class BtnDirective {
  variant = input<BtnVariant>('primary');
  size = input<BtnSize>('md');
  loading = input(false);
  block = input(false);
  disabled = input(false);
}
