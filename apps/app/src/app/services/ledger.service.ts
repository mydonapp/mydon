import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export type ClosingMode = 'SIMPLE' | 'ADVANCED';

export interface Ledger {
  id: string;
  name: string;
  baseCurrency: string;
  fiscalYearStartMonth: number;
  closingMode: ClosingMode;
  retainedEarningsAccountId: string | null;
}

export interface UpdateLedgerPayload {
  name?: string;
  fiscalYearStartMonth?: number;
  closingMode?: ClosingMode;
  retainedEarningsAccountId?: string | null;
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

  async update(payload: UpdateLedgerPayload): Promise<Ledger> {
    const ledger = await firstValueFrom(this.http.patch<Ledger>(`${this.appConfig.apiUrl}/v1/ledger`, payload));
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
