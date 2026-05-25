import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { BudgetsService } from './budgets.service';
import { ReportsService } from './reports.service';

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
  private reportsService = inject(ReportsService);
  private budgetsService = inject(BudgetsService);

  accounts = signal<AccountSimple[]>([]);
  timeFilter = signal(new Date().getFullYear().toString());

  private simpleLoaded = false;
  private accountsByKey = new Map<string, AccountsResponse>();
  private accountDetailByKey = new Map<string, AccountDetail>();
  private transactionsByKey = new Map<string, TransactionRecord[]>();
  private recentTransactionsCache: TransactionRecord[] | null = null;
  private draftTransactionsCache: TransactionRecord[] | null = null;
  private issuersCache: Issuer[] | null = null;

  async fetchSimple(force = false): Promise<void> {
    if (this.simpleLoaded && !force) {
      return;
    }
    const accounts = await firstValueFrom(
      this.http.get<AccountSimple[]>(`${this.appConfig.apiUrl}/v1/accounts?list=true`),
    );
    this.accounts.set(accounts);
    this.simpleLoaded = true;
  }

  async fetchAccounts(params?: Record<string, string>): Promise<AccountsResponse> {
    const year = this.timeFilter();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const query = new URLSearchParams({ from, to, ...params }).toString();
    const cached = this.accountsByKey.get(query);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(this.http.get<AccountsResponse>(`${this.appConfig.apiUrl}/v1/accounts?${query}`));
    this.accountsByKey.set(query, data);
    return data;
  }

  async fetchAccount(id: string, year: string): Promise<AccountDetail> {
    const key = `${id}|${year}`;
    const cached = this.accountDetailByKey.get(key);
    if (cached) {
      return cached;
    }
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const data = await firstValueFrom(
      this.http.get<AccountDetail>(`${this.appConfig.apiUrl}/v1/accounts/${id}?from=${from}&to=${to}`),
    );
    this.accountDetailByKey.set(key, data);
    return data;
  }

  async fetchTransactions(accountId: string, params?: Record<string, string>): Promise<TransactionRecord[]> {
    const year = this.timeFilter();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const query = new URLSearchParams({ from, to, ...params }).toString();
    const key = `${accountId}|${query}`;
    const cached = this.transactionsByKey.get(key);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(
      this.http.get<TransactionRecord[]>(`${this.appConfig.apiUrl}/v1/accounts/${accountId}/transactions?${query}`),
    );
    this.transactionsByKey.set(key, data);
    return data;
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
    this.invalidateAccounts();
    await this.fetchSimple(true);
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
    this.invalidateAccounts();
    this.invalidateTransactions();
    await this.fetchSimple(true);
  }

  async createTransaction(data: CreateTransactionPayload): Promise<void> {
    await firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/transactions`, data));
    this.invalidateTransactions();
  }

  async fetchRecentTransactions(): Promise<TransactionRecord[]> {
    if (this.recentTransactionsCache) {
      return this.recentTransactionsCache;
    }
    const data = await firstValueFrom(this.http.get<TransactionRecord[]>(`${this.appConfig.apiUrl}/v1/transactions`));
    this.recentTransactionsCache = data;
    return data;
  }

  async fetchDraftTransactions(): Promise<TransactionRecord[]> {
    if (this.draftTransactionsCache) {
      return this.draftTransactionsCache;
    }
    const data = await firstValueFrom(
      this.http.get<TransactionRecord[]>(`${this.appConfig.apiUrl}/v1/transactions?filter=draft`),
    );
    this.draftTransactionsCache = data;
    return data;
  }

  async approveDraftTransactions(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id) => firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/transactions/${id}/post`, {}))),
    );
    this.invalidateTransactions();
  }

  async updateDraftTransaction(id: string, data: PatchTransactionPayload): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/transactions/${id}`, data));
    this.invalidateTransactions();
  }

  async deleteDraftTransaction(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.appConfig.apiUrl}/v1/transactions/${id}`));
    this.invalidateTransactions();
  }

  async importTransactions(accountId: string, issuerId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('accountId', accountId);
    formData.append('issuerId', issuerId);
    formData.append('file', file);
    await firstValueFrom(this.http.post(`${this.appConfig.apiUrl}/v1/transactions/import`, formData));
    this.invalidateTransactions();
  }

  async fetchIssuers(): Promise<Issuer[]> {
    if (this.issuersCache) {
      return this.issuersCache;
    }
    const data = await firstValueFrom(this.http.get<Issuer[]>(`${this.appConfig.apiUrl}/v1/transactions/issuers`));
    this.issuersCache = data;
    return data;
  }

  async fetchSpendingAnalysis(params: Record<string, string>): Promise<SpendingAnalysis> {
    const query = new URLSearchParams(params).toString();
    return firstValueFrom(
      this.http.get<SpendingAnalysis>(`${this.appConfig.apiUrl}/v1/transactions/analysis?${query}`),
    );
  }

  invalidate(): void {
    this.invalidateAccounts();
    this.invalidateTransactions();
  }

  clearCache(): void {
    this.invalidate();
    this.accounts.set([]);
    this.issuersCache = null;
  }

  private invalidateAccounts(): void {
    this.simpleLoaded = false;
    this.accountsByKey.clear();
    this.accountDetailByKey.clear();
    this.reportsService.invalidate();
    this.budgetsService.invalidate();
  }

  private invalidateTransactions(): void {
    this.transactionsByKey.clear();
    this.recentTransactionsCache = null;
    this.draftTransactionsCache = null;
    this.accountsByKey.clear();
    this.accountDetailByKey.clear();
    this.reportsService.invalidate();
    this.budgetsService.invalidate();
  }
}
