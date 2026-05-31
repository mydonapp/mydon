import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface BudgetSummary {
  id: string;
  name: string;
  year: number;
  itemCount: number;
}

export interface BudgetSubItem {
  id?: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
}

export interface BudgetItem {
  id: string;
  type: 'group' | 'account';
  groupId?: string;
  groupName?: string;
  accountId?: string;
  accountName?: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  subItems?: BudgetSubItem[];
}

export interface BudgetDetail {
  id: string;
  name: string;
  year: number;
  items: BudgetItem[];
}

export interface BudgetProgressItem {
  id: string;
  name: string;
  type: 'group' | 'account';
  accountType: string | null;
  accountCode: string | null;
  amount: number;
  frequency: 'monthly' | 'yearly';
  monthlyBudget: number;
  yearlyBudget: number;
  actual: number;
  percentage: number;
  projectedYearly: number | null;
  prevActual: number;
  monthOverMonthChange: number | null;
  accounts?: { id: string; name: string; actual: number }[];
}

export interface BudgetProgress {
  viewType: 'yearly' | 'monthly';
  year: number;
  month?: number;
  monthsElapsed: number;
  items: BudgetProgressItem[];
}

export interface MonthlyBreakdownItem {
  id: string;
  name: string;
  type: 'group' | 'account';
  accountType: string | null;
  accountCode: string | null;
  monthlyBudget: number;
  months: number[];
}

export interface MonthlyBreakdown {
  year: number;
  items: MonthlyBreakdownItem[];
}

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  private budgetsCache: BudgetSummary[] | null = null;
  private budgetByKey = new Map<string, BudgetDetail>();
  private progressByKey = new Map<string, BudgetProgress>();
  private monthlyByKey = new Map<string, MonthlyBreakdown>();

  async fetchBudgets(): Promise<BudgetSummary[]> {
    if (this.budgetsCache) {
      return this.budgetsCache;
    }
    const data = await firstValueFrom(this.http.get<BudgetSummary[]>(`${this.appConfig.apiUrl}/v1/budgets`));
    this.budgetsCache = data;
    return data;
  }

  async fetchBudget(id: string): Promise<BudgetDetail> {
    const cached = this.budgetByKey.get(id);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(this.http.get<BudgetDetail>(`${this.appConfig.apiUrl}/v1/budgets/${id}`));
    this.budgetByKey.set(id, data);
    return data;
  }

  async createBudget(data: { name: string; year: number }): Promise<BudgetSummary> {
    const created = await firstValueFrom(this.http.post<BudgetSummary>(`${this.appConfig.apiUrl}/v1/budgets`, data));
    this.invalidate();
    return created;
  }

  async duplicateBudget(id: string, data: { name: string; year: number }): Promise<BudgetSummary> {
    const created = await firstValueFrom(
      this.http.post<BudgetSummary>(`${this.appConfig.apiUrl}/v1/budgets/${id}/duplicate`, data),
    );
    this.invalidate();
    return created;
  }

  async updateBudget(id: string, data: { name?: string; year?: number }): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/budgets/${id}`, data));
    this.invalidate();
  }

  async deleteBudget(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.appConfig.apiUrl}/v1/budgets/${id}`));
    this.invalidate();
  }

  async upsertBudgetItems(budgetId: string, items: Omit<BudgetItem, 'id'>[]): Promise<void> {
    await firstValueFrom(this.http.put(`${this.appConfig.apiUrl}/v1/budgets/${budgetId}/items`, { items }));
    this.invalidate();
  }

  async fetchProgress(
    budgetId: string,
    params: { viewType: string; year: number; month?: number },
  ): Promise<BudgetProgress> {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    const key = `${budgetId}|${query}`;
    const cached = this.progressByKey.get(key);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(
      this.http.get<BudgetProgress>(`${this.appConfig.apiUrl}/v1/budgets/${budgetId}/progress?${query}`),
    );
    this.progressByKey.set(key, data);
    return data;
  }

  async fetchMonthlyBreakdown(budgetId: string, year: number): Promise<MonthlyBreakdown> {
    const key = `${budgetId}|${year}`;
    const cached = this.monthlyByKey.get(key);
    if (cached) {
      return cached;
    }
    const data = await firstValueFrom(
      this.http.get<MonthlyBreakdown>(`${this.appConfig.apiUrl}/v1/budgets/${budgetId}/monthly?year=${year}`),
    );
    this.monthlyByKey.set(key, data);
    return data;
  }

  invalidate(): void {
    this.budgetsCache = null;
    this.budgetByKey.clear();
    this.progressByKey.clear();
    this.monthlyByKey.clear();
  }

  clearCache(): void {
    this.invalidate();
  }
}
