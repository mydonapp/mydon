import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BudgetSummary {
  id: string;
  name: string;
  year: number;
  itemCount: number;
}

export interface BudgetItem {
  id: string;
  type: 'category' | 'account';
  categoryId?: string;
  categoryName?: string;
  accountId?: string;
  accountName?: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
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
  type: 'category' | 'account';
  amount: number;
  frequency: 'monthly' | 'yearly';
  monthlyBudget: number;
  yearlyBudget: number;
  actual: number;
  percentage: number;
  projectedYearly: number;
  vsLastPeriod: number;
  accounts?: { id: string; name: string; actual: number }[];
}

export interface BudgetProgress {
  viewType: 'yearly' | 'monthly';
  year: number;
  month?: number;
  monthsElapsed: number;
  items: BudgetProgressItem[];
}

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private http = inject(HttpClient);

  async fetchBudgets(): Promise<BudgetSummary[]> {
    return firstValueFrom(
      this.http.get<BudgetSummary[]>(`${environment.apiUrl}/v1/budgets`),
    );
  }

  async fetchBudget(id: string): Promise<BudgetDetail> {
    return firstValueFrom(
      this.http.get<BudgetDetail>(`${environment.apiUrl}/v1/budgets/${id}`),
    );
  }

  async createBudget(data: { name: string; year: number }): Promise<BudgetSummary> {
    return firstValueFrom(
      this.http.post<BudgetSummary>(`${environment.apiUrl}/v1/budgets`, data),
    );
  }

  async updateBudget(id: string, data: { name?: string; year?: number }): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${environment.apiUrl}/v1/budgets/${id}`, data),
    );
  }

  async deleteBudget(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${environment.apiUrl}/v1/budgets/${id}`),
    );
  }

  async upsertBudgetItems(budgetId: string, items: Omit<BudgetItem, 'id'>[]): Promise<void> {
    await firstValueFrom(
      this.http.put(
        `${environment.apiUrl}/v1/budgets/${budgetId}/items`,
        { items },
      ),
    );
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
    return firstValueFrom(
      this.http.get<BudgetProgress>(
        `${environment.apiUrl}/v1/budgets/${budgetId}/progress?${query}`,
      ),
    );
  }
}
