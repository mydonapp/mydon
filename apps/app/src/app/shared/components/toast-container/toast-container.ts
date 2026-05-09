import { Component, inject } from '@angular/core';
import {
  LucideAngularModule,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  LucideIconData,
} from 'lucide-angular';
import { ToastService, ToastType } from '../../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [LucideAngularModule],
  templateUrl: './toast-container.html',
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  readonly checkIcon: LucideIconData   = CheckCircle2;
  readonly errorIcon: LucideIconData   = AlertCircle;
  readonly warningIcon: LucideIconData = AlertTriangle;
  readonly infoIcon: LucideIconData    = Info;
  readonly closeIcon: LucideIconData   = X;

  iconFor(type: ToastType): LucideIconData {
    switch (type) {
      case 'success': return this.checkIcon;
      case 'error':   return this.errorIcon;
      case 'warning': return this.warningIcon;
      default:        return this.infoIcon;
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
