import { Directive, input } from '@angular/core';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

@Directive({
  selector: '[appBadge]',
  host: {
    class: 'badge',
    '[class.badge--primary]': 'variant() === "primary"',
    '[class.badge--success]': 'variant() === "success"',
    '[class.badge--warning]': 'variant() === "warning"',
    '[class.badge--error]': 'variant() === "error"',
    '[class.badge--info]': 'variant() === "info"',
    '[class.badge--sm]': 'size() === "sm"',
  },
})
export class BadgeDirective {
  variant = input<BadgeVariant>('default');
  size = input<BadgeSize>('md');
}
