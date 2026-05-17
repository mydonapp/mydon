import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface AccountSimple {
  id: string;
  name: string;
  description: string;
  type: string;
  currency: string;
  isActive: boolean;
  activeFrom: string | null;
  activeUntil: string | null;
  retirementAccount: boolean;
  code: string;
  groupId: string | null;
  groupName: string | null;
}

export interface AccountDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  code: string;
  activeFrom: string | null;
  activeUntil: string | null;
  isActive: boolean;
  currency: string;
  retirementAccount: boolean;
  group: { id: string; name: string } | null;
  balance: number;
  totalTransactions: number;
  totalCredit: number;
  totalDebit: number;
}

export interface AccountBalance {
  id: string;
  name: string;
  description: string;
  type: string;
  code: string;
  creditBalance: number;
  debitBalance: number;
  balance: number;
  currency: string;
  balanceMainCurrency: number;
  retirementAccount: boolean;
  groupId: string | null;
  groupName: string | null;
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

export type EntryDirection = 'DEBIT' | 'CREDIT';

export interface TransactionEntry {
  id: string;
  accountId: string;
  accountName?: string;
  accountType?: string;
  direction: EntryDirection;
  amount: number;
  currency: string;
  fxRate: number;
  baseAmount: number;
  aiSuggested?: boolean;
}

export interface EntryInput {
  accountId: string;
  direction: EntryDirection;
  amount: number;
  currency?: string;
  fxRate?: number;
  aiSuggested?: boolean;
}

export interface TransactionRecord {
  id: string;
  ledgerId: string;
  description: string;
  reference: string | null;
  transactionDate: string;
  postedAt: string | null;
  reversesTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  entries: TransactionEntry[];
  amount: number;
  draft: boolean;
}

export interface Issuer {
  id: string;
  name: string;
}

export interface CreateTransactionPayload {
  description: string;
  reference?: string;
  transactionDate: string;
  entries: EntryInput[];
  post?: boolean;
}

export interface PatchTransactionPayload {
  description?: string;
  reference?: string;
  transactionDate?: string;
  entries?: EntryInput[];
}

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
    groupId?: string;
    code?: string;
    description?: string;
  }): Promise<void> {
    await firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/accounts`, account));
    await this.fetchSimple();
  }

  async updateAccount(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      type: string;
      currency: string;
      groupId: string;
      code: string;
      activeFrom: string | null;
      activeUntil: string | null;
    }>,
  ): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/accounts/${id}`, data));
    await this.fetchSimple();
  }

  async createTransaction(data: CreateTransactionPayload): Promise<void> {
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
      ids.map((id) => firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/transactions/${id}/post`, {}))),
    );
  }

  async updateDraftTransaction(id: string, data: PatchTransactionPayload): Promise<void> {
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
