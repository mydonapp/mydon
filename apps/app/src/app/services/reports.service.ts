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
  /** Un-closed prior-period income/expense rolled virtually into retained earnings. */
  priorPeriodResult: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
}

export interface IncomeStatementRow {
  id: string;
  code: string;
  name: string;
  current: number;
  previous: number;
}

export interface IncomeStatementSection {
  rows: IncomeStatementRow[];
  currentTotal: number;
  previousTotal: number;
}

export interface IncomeStatement {
  baseCurrency: string;
  currentLabel: string;
  previousLabel: string | null;
  income: IncomeStatementSection;
  expense: IncomeStatementSection;
  netResult: { current: number; previous: number };
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  private trialBalanceByYear = new Map<string, TrialBalance>();
  private balanceSheetByYear = new Map<string, BalanceSheet>();
  private incomeStatementByYear = new Map<string, IncomeStatement>();

  private range(year: string): string {
    return new URLSearchParams({ from: `${year}-01-01`, to: `${year}-12-31` }).toString();
  }

  async fetchTrialBalance(year: string): Promise<TrialBalance> {
    const cached = this.trialBalanceByYear.get(year);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(
      this.http.get<TrialBalance>(`${this.appConfig.apiUrl}/v1/reports/trial-balance?${this.range(year)}`),
    );
    this.trialBalanceByYear.set(year, data);
    return data;
  }

  async fetchBalanceSheet(year: string): Promise<BalanceSheet> {
    const cached = this.balanceSheetByYear.get(year);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(
      this.http.get<BalanceSheet>(`${this.appConfig.apiUrl}/v1/reports/balance-sheet?${this.range(year)}`),
    );
    this.balanceSheetByYear.set(year, data);
    return data;
  }

  async fetchIncomeStatement(year: string): Promise<IncomeStatement> {
    const cached = this.incomeStatementByYear.get(year);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(
      this.http.get<IncomeStatement>(`${this.appConfig.apiUrl}/v1/reports/income-statement?${this.range(year)}`),
    );
    this.incomeStatementByYear.set(year, data);
    return data;
  }

  async downloadPdf(report: 'trial-balance' | 'balance-sheet' | 'income-statement', year: string): Promise<void> {
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

  invalidate(): void {
    this.trialBalanceByYear.clear();
    this.balanceSheetByYear.clear();
    this.incomeStatementByYear.clear();
  }

  clearCache(): void {
    this.invalidate();
  }
}
