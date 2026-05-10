import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService } from '../../services/accounts.service';
import { CurrencyService } from '../../services/currency.service';
import { PrivacyService } from '../../services/privacy.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';
import { IconComponent } from '../../shared/components/icon/icon';

interface DashboardStats {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  thisExpense: number;
  thisIncome: number;
  cashFlow: number;
  expenseChange: number | null;
  incomeChange: number | null;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    DatePipe,
    TranslateModule,
    PageHeaderComponent,
    BtnDirective,
    SpinnerComponent,
    IconComponent,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  accountsService = inject(AccountsService);
  currencyService = inject(CurrencyService);
  privacyService = inject(PrivacyService);

  loading = signal(false);
  stats = signal<DashboardStats | null>(null);
  recentTransactions = signal<any[]>([]);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const now = new Date();
      const thisStart = this.toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
      const today    = this.toDateStr(now);
      const lastStart = this.toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const lastEnd   = this.toDateStr(new Date(now.getFullYear(), now.getMonth(), 0));

      const [thisPeriod, lastPeriod, txs] = await Promise.all([
        this.accountsService.fetchAccounts({ from: thisStart, to: today }),
        this.accountsService.fetchAccounts({ from: lastStart, to: lastEnd }),
        this.accountsService.fetchRecentTransactions(),
      ]);

      const assets      = thisPeriod.assets?.total      ?? 0;
      const liabilities = thisPeriod.liabilities?.total ?? 0;
      const thisExpense = thisPeriod.expense?.total      ?? 0;
      const thisIncome  = thisPeriod.income?.total       ?? 0;
      const lastExpense = lastPeriod.expense?.total      ?? 0;
      const lastIncome  = lastPeriod.income?.total       ?? 0;

      this.stats.set({
        netWorth: assets - liabilities,
        totalAssets: assets,
        totalLiabilities: liabilities,
        thisExpense,
        thisIncome,
        cashFlow: thisIncome - thisExpense,
        expenseChange: lastExpense !== 0 ? ((thisExpense - lastExpense) / Math.abs(lastExpense)) * 100 : null,
        incomeChange:  lastIncome  !== 0 ? ((thisIncome  - lastIncome)  / Math.abs(lastIncome))  * 100 : null,
      });

      this.recentTransactions.set(txs.filter((tx: any) => !tx.draft).slice(0, 5));
    } catch {
      // silent
    } finally {
      this.loading.set(false);
    }
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatPct(value: number): string {
    return `${Math.round(Math.abs(value))}%`;
  }

  // Spending: up = bad (red), down = good (green)
  spendingChangeClass(change: number): string {
    return change > 0 ? 'text-error' : 'text-success';
  }

  // Income: up = good (green), down = bad (red)
  incomeChangeClass(change: number): string {
    return change > 0 ? 'text-success' : 'text-error';
  }
}
