import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface AccountSimple {
  id: string;
  name: string;
  type: string;
  currency: string;
  isActive: boolean;
  retirementAccount: boolean;
  openingBalance: number;
  accountNumber: number | null;
  categoryId: string | null;
  categoryName: string | null;
}

export interface AccountDetail {
  id: string;
  name: string;
  type: string;
  accountNumber: number | null;
  currency: string;
  isActive: boolean;
  retirementAccount: boolean;
  category: { id: string; name: string } | null;
  balance: number;
  totalTransactions: number;
  totalCredit: number;
  totalDebit: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  creditAccountId: string;
  creditAccountName: string;
  debitAccountId: string;
  debitAccountName: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: string;
  accountNumber: number | null;
  creditBalance: number;
  debitBalance: number;
  balance: number;
  currency: string;
  balanceMainCurrency: number;
  retirementAccount: boolean;
  categoryId: string | null;
  categoryName: string | null;
}

export interface AccountGroup {
  accounts: AccountBalance[];
  total: number;
  totalWithoutRetirement?: number;
}

export interface AccountsResponse {
  assets: AccountGroup;
  liabilities: AccountGroup;
  equity: AccountGroup;
  income: AccountGroup;
  expense: AccountGroup;
}

export interface TransactionRecord {
  id: string;
  creditAmount: number;
  debitAmount: number;
  amount: number;
  description: string;
  creditAccountId: string;
  debitAccountId: string;
  transactionDate: string;
  draft: boolean;
  creditAccountAISuggested?: boolean;
  debitAccountAISuggested?: boolean;
  matchedTransactionId?: string | null;
}

export interface Issuer {
  id: string;
  name: string;
}

export type PatchTransactionData = Partial<{
  debitAmount: number;
  creditAmount: number;
  description: string;
  creditAccountId: string;
  debitAccountId: string;
  draft: boolean;
}>;

export type SpendingAnalysis = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  accounts = signal<AccountSimple[]>([]);
  timeFilter = signal(new Date().getFullYear().toString());

  async fetchSimple(): Promise<void> {
    const accounts = await firstValueFrom(
      this.http.get<AccountSimple[]>(`${this.appConfig.apiUrl}/v1/accounts?list=true`),
    );
    this.accounts.set(accounts);
  }

  async fetchAccounts(params?: Record<string, string>): Promise<AccountsResponse> {
    const year = this.timeFilter();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const query = new URLSearchParams({ from, to, ...params }).toString();
    return firstValueFrom(this.http.get<AccountsResponse>(`${this.appConfig.apiUrl}/v1/accounts?${query}`));
  }

  async fetchAccount(id: string): Promise<AccountDetail> {
    const year = this.timeFilter();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    return firstValueFrom(
      this.http.get<AccountDetail>(`${this.appConfig.apiUrl}/v1/accounts/${id}?from=${from}&to=${to}`),
    );
  }

  async fetchTransactions(accountId: string, params?: Record<string, string>): Promise<TransactionRecord[]> {
    const year = this.timeFilter();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const query = new URLSearchParams({ from, to, ...params }).toString();
    return firstValueFrom(
      this.http.get<TransactionRecord[]>(`${this.appConfig.apiUrl}/v1/accounts/${accountId}/transactions?${query}`),
    );
  }

  async createAccount(account: {
    name: string;
    type: string;
    currency: string;
    openingBalance?: number;
    categoryId?: string;
  }): Promise<void> {
    await firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/accounts`, account));
    await this.fetchSimple();
  }

  async updateAccount(
    id: string,
    data: Partial<{
      name: string;
      type: string;
      currency: string;
      isActive: boolean;
      categoryId: string;
      openingBalance: number;
      accountNumber: number | null;
    }>,
  ): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/accounts/${id}`, data));
    await this.fetchSimple();
  }

  async createTransaction(data: {
    transactionDate: string;
    description: string;
    creditAccountId: string;
    debitAccountId: string;
    creditAmount: number;
    debitAmount: number;
  }): Promise<void> {
    await firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/transactions`, data));
  }

  async fetchRecentTransactions(): Promise<TransactionRecord[]> {
    return firstValueFrom(this.http.get<TransactionRecord[]>(`${this.appConfig.apiUrl}/v1/transactions`));
  }

  async fetchDraftTransactions(): Promise<TransactionRecord[]> {
    return firstValueFrom(this.http.get<TransactionRecord[]>(`${this.appConfig.apiUrl}/v1/transactions?filter=draft`));
  }

  async approveDraftTransactions(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id) =>
        firstValueFrom(
          this.http.patch(`${this.appConfig.apiUrl}/v1/transactions/${id}`, {
            draft: false,
          }),
        ),
      ),
    );
  }

  async updateDraftTransaction(id: string, data: PatchTransactionData): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/transactions/${id}`, data));
  }

  async deleteDraftTransaction(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.appConfig.apiUrl}/v1/transactions/${id}`));
  }

  async importTransactions(accountId: string, issuerId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('accountId', accountId);
    formData.append('issuerId', issuerId);
    formData.append('file', file);
    await firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/transactions/import`, formData));
  }

  async fetchIssuers(): Promise<Issuer[]> {
    return firstValueFrom(this.http.get<Issuer[]>(`${this.appConfig.apiUrl}/v1/transactions/issuers`));
  }

  async fetchSpendingAnalysis(params: Record<string, string>): Promise<SpendingAnalysis> {
    const query = new URLSearchParams(params).toString();
    return firstValueFrom(
      this.http.get<SpendingAnalysis>(`${this.appConfig.apiUrl}/v1/transactions/analysis?${query}`),
    );
  }
}
