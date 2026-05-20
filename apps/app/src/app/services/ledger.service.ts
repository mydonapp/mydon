import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface Ledger {
  id: string;
  name: string;
  baseCurrency: string;
}

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  readonly ledger = signal<Ledger | null>(null);
  private loaded = false;

  async fetch(force = false): Promise<Ledger> {
    const current = this.ledger();
    if (this.loaded && current && !force) {
      return current;
    }
    const ledger = await firstValueFrom(this.http.get<Ledger>(`${this.appConfig.apiUrl}/v1/ledger`));
    this.ledger.set(ledger);
    this.loaded = true;
    return ledger;
  }

  baseCurrency(): string {
    return this.ledger()?.baseCurrency ?? 'CHF';
  }

  clearCache(): void {
    this.loaded = false;
    this.ledger.set(null);
  }
}
