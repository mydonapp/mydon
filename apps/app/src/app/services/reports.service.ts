import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  baseCurrency: string;
  rows: TrialBalanceRow[];
  debitTotal: number;
  creditTotal: number;
  difference: number;
  balanced: boolean;
}

export interface BalanceSheetLine {
  id: string;
  code: string;
  name: string;
  currency: string;
  amount: number;
}

export interface BalanceSheetSection {
  accounts: BalanceSheetLine[];
  total: number;
}

export interface BalanceSheet {
  baseCurrency: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  netResult: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  private range(year: string): string {
    return new URLSearchParams({ from: `${year}-01-01`, to: `${year}-12-31` }).toString();
  }

  async fetchTrialBalance(year: string): Promise<TrialBalance> {
    return firstValueFrom(
      this.http.get<TrialBalance>(`${this.appConfig.apiUrl}/v1/reports/trial-balance?${this.range(year)}`),
    );
  }

  async fetchBalanceSheet(year: string): Promise<BalanceSheet> {
    return firstValueFrom(
      this.http.get<BalanceSheet>(`${this.appConfig.apiUrl}/v1/reports/balance-sheet?${this.range(year)}`),
    );
  }

  async downloadPdf(report: 'trial-balance' | 'balance-sheet', year: string): Promise<void> {
    const blob = await firstValueFrom(
      this.http.get(`${this.appConfig.apiUrl}/v1/reports/${report}/pdf?${this.range(year)}`, {
        responseType: 'blob',
      }),
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report}-${year}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
