import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../../services/toast.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-toast-container',
  imports: [IconComponent],
  templateUrl: './toast-container.html',
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  iconFor(type: ToastType): string {
    switch (type) {
      case 'success': return 'check-circle-2';
      case 'error':   return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default:        return 'info';
    }
  }

  colorFor(type: ToastType): string {
    switch (type) {
      case 'success': return 'var(--sys-income)';
      case 'error':   return 'var(--sys-error)';
      case 'warning': return 'var(--color-warning)';
      default:        return 'var(--sys-primary)';
    }
  }
}
