import { Injectable, inject } from '@angular/core';
import { PrivacyService } from './privacy.service';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private privacy = inject(PrivacyService);

  format(value: number, currency: string): string {
    if (this.privacy.isPrivate()) {
      return '***';
    }
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency || 'CHF',
    }).format(value);
  }
}
