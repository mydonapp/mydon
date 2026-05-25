import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export type EntryDirection = 'DEBIT' | 'CREDIT';

export interface ClosingEntryPreview {
  accountId: string;
  accountName: string;
  accountType: string;
  direction: EntryDirection;
  amount: number;
  currency: string;
}

export interface ClosingPreview {
  fiscalYearStartYear: number;
  periodStart: string;
  periodEnd: string;
  baseCurrency: string;
  retainedEarningsAccountId: string;
  retainedEarningsAccountName: string;
  netResult: number;
  entries: ClosingEntryPreview[];
  skipped: { accountId: string; accountName: string; currency: string; balance: number }[];
  alreadyClosed: boolean;
}

export type FiscalYearState = 'OPEN' | 'CLOSING' | 'CLOSED';

export interface ClosableYear {
  fiscalYearStartYear: number;
  label: string;
  periodStart: string;
  periodEnd: string;
  closed: boolean;
  state: FiscalYearState | null;
  fiscalYearId: string | null;
  isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClosingsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  async candidates(): Promise<ClosableYear[]> {
    return firstValueFrom(this.http.get<ClosableYear[]>(`${this.appConfig.apiUrl}/v1/closings/candidates`));
  }

  async preview(fiscalYearStartYear: number): Promise<ClosingPreview> {
    return firstValueFrom(
      this.http.post<ClosingPreview>(`${this.appConfig.apiUrl}/v1/closings/preview`, { fiscalYearStartYear }),
    );
  }

  async closeFiscalYear(fiscalYearStartYear: number): Promise<unknown> {
    return firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/closings`, { fiscalYearStartYear }));
  }
}
