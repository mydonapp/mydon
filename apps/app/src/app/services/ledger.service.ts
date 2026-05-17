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

  async fetch(): Promise<Ledger> {
    const ledger = await firstValueFrom(this.http.get<Ledger>(`${this.appConfig.apiUrl}/v1/ledger`));
    this.ledger.set(ledger);
    return ledger;
  }

  baseCurrency(): string {
    return this.ledger()?.baseCurrency ?? 'CHF';
  }
}
