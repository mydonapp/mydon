import { ref } from 'vue';
import { useAuth } from '../useAuth';
import { useConstant } from '../useConstant';

export interface BudgetSummary {
  id: string;
  name: string;
  year: number;
  itemCount: number;
}

export interface BudgetItem {
  id: string;
  type: 'category' | 'account';
  categoryId: string | null;
  categoryName: string | null;
  accountId: string | null;
  accountName: string | null;
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
  type: 'category' | 'account';
  categoryId: string | null;
  categoryName: string | null;
  accountId: string | null;
  accountName: string | null;
  frequency: 'monthly' | 'yearly';
  amount: number;
  monthlyBudget: number;
  yearlyBudget: number;
  displayBudget: number;
  actual: number;
  percentage: number;
  prevActual: number;
  monthOverMonthChange: number | null;
  projectedYearly: number | null;
  recommendation: 'on_pace_to_exceed' | 'over_budget' | null;
  accounts: { id: string; name: string; actual: number }[];
}

export interface BudgetProgress {
  viewType: 'monthly' | 'yearly';
  year: number;
  month: number | null;
  monthsElapsed: number;
  items: BudgetProgressItem[];
}

export const useBudgets = () => {
  const { getAccessToken } = useAuth();
  const { URI } = useConstant();

  const authHeaders = () => ({
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
  });

  const fetchBudgets = async (): Promise<BudgetSummary[]> => {
    const res = await fetch(`${URI.API}/v1/budgets`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    return res.json();
  };

  const fetchBudget = async (id: string): Promise<BudgetDetail> => {
    const res = await fetch(`${URI.API}/v1/budgets/${id}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    return res.json();
  };

  const createBudget = async (name: string, year: number): Promise<BudgetSummary> => {
    const res = await fetch(`${URI.API}/v1/budgets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, year }),
    });
    return res.json();
  };

  const updateBudget = async (id: string, data: { name?: string; year?: number }): Promise<void> => {
    await fetch(`${URI.API}/v1/budgets/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
  };

  const deleteBudget = async (id: string): Promise<void> => {
    await fetch(`${URI.API}/v1/budgets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
  };

  const upsertBudgetItems = async (id: string, items: Omit<BudgetItem, 'id'>[]): Promise<BudgetDetail> => {
    const res = await fetch(`${URI.API}/v1/budgets/${id}/items`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    });
    return res.json();
  };

  const fetchProgress = async (
    id: string,
    year: number,
    month?: number,
  ): Promise<BudgetProgress> => {
    const params = new URLSearchParams({ year: String(year) });
    if (month !== undefined) params.set('month', String(month));
    const res = await fetch(`${URI.API}/v1/budgets/${id}/progress?${params}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    return res.json();
  };

  return {
    fetchBudgets,
    fetchBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    upsertBudgetItems,
    fetchProgress,
  };
};
