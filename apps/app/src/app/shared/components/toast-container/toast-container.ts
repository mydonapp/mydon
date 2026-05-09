import { Component, inject } from '@angular/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  imports: [],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  alertClass(type: string): string {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  }
}
