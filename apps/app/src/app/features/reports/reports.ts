import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyService } from '../../services/currency.service';
import { ListStyleService } from '../../services/list-style.service';
import { PrivacyService } from '../../services/privacy.service';
import {
  BalanceSheet,
  IncomeStatement,
  IncomeStatementMonthly,
  ReportsService,
  TrialBalance,
} from '../../services/reports.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { SelectDirective } from '../../shared/directives/select.directive';

type Tab = 'trialBalance' | 'balanceSheet' | 'incomeStatement';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports',
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  imports: [
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BtnDirective,
    SelectDirective,
    IconComponent,
    SkeletonComponent,
  ],
})
export class ReportsComponent implements OnInit {
  protected readonly currencyService = inject(CurrencyService);
  protected readonly listStyleService = inject(ListStyleService);
  protected readonly privacyService = inject(PrivacyService);
  private readonly reportsService = inject(ReportsService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  activeTab = signal<Tab>('trialBalance');
  year = signal(new Date().getFullYear().toString());
  loading = signal(false);
  downloading = signal(false);

  trialBalance = signal<TrialBalance | null>(null);
  balanceSheet = signal<BalanceSheet | null>(null);
  incomeStatement = signal<IncomeStatement | null>(null);
  incomeStatementMonthly = signal<IncomeStatementMonthly | null>(null);
  incomeView = signal<'yearly' | 'monthly'>('yearly');

  readonly years: string[] = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));
  /** Short month labels (Jan–Dec) for the monthly P&L matrix header; runtime locale, no i18n keys. */
  readonly monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'short' }),
  );

  ngOnInit() {
    this.load();
  }

  setTab(tab: Tab) {
    if (this.activeTab() === tab) {
      return;
    }
    this.activeTab.set(tab);
    this.load();
  }

  onYearChange(year: string) {
    this.year.set(year);
    this.trialBalance.set(null);
    this.balanceSheet.set(null);
    this.incomeStatement.set(null);
    this.incomeStatementMonthly.set(null);
    this.load();
  }

  setIncomeView(view: 'yearly' | 'monthly') {
    if (this.incomeView() === view) {
      return;
    }
    this.incomeView.set(view);
    if (view === 'monthly') {
      this.load();
    }
  }

  /** Months with any income/expense activity — the shared divisor for all average columns. A line can be
   *  0 in an active month, so we only skip months where every line is 0 (e.g. the not-yet-booked month). */
  readonly activeMonthsCount = computed(() => {
    const data = this.incomeStatementMonthly();
    if (!data) {
      return 0;
    }
    let count = 0;
    for (let i = 0; i < 12; i++) {
      if (data.income.rows.some((r) => r.months[i]) || data.expense.rows.some((r) => r.months[i])) {
        count += 1;
      }
    }
    return count;
  });

  monthlyAvg(months: number[]): number {
    const divisor = this.activeMonthsCount();
    if (divisor === 0) {
      return 0;
    }
    const sum = months.reduce((s, m) => s + (m ?? 0), 0);
    return Math.round((sum / divisor) * 100) / 100;
  }

  async toggleListStyle() {
    const next = this.listStyleService.listStyle() === 'compact' ? 'normal' : 'compact';
    this.listStyleService.set(next);
    try {
      await this.userService.updatePreferences({ listStyle: next });
    } catch {
      // stub
    }
  }

  format(amount: number, currency: string): string {
    return this.privacyService.isPrivate() ? '···' : this.currencyService.format(amount, currency);
  }

  /** Matrix number formatted for display: masked under privacy mode, '·' for empty cells. */
  num(value: number, maxDecimals = 0, blankZero = true): string {
    if (this.privacyService.isPrivate()) {
      return '···';
    }
    if (blankZero && !value) {
      return '·';
    }
    return value.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals });
  }

  hasPriorPeriodResult(bs: BalanceSheet): boolean {
    return Math.abs(bs.priorPeriodResult) > 0.005;
  }

  async download() {
    const report =
      this.activeTab() === 'trialBalance'
        ? 'trial-balance'
        : this.activeTab() === 'incomeStatement'
          ? 'income-statement'
          : 'balance-sheet';
    this.downloading.set(true);
    try {
      await this.reportsService.downloadPdf(report, this.year());
    } catch {
      this.toastService.error('views.reports.downloadError');
    } finally {
      this.downloading.set(false);
    }
  }

  private async load() {
    this.loading.set(true);
    try {
      if (this.activeTab() === 'trialBalance') {
        this.trialBalance.set(await this.reportsService.fetchTrialBalance(this.year()));
      } else if (this.activeTab() === 'incomeStatement') {
        this.incomeStatement.set(await this.reportsService.fetchIncomeStatement(this.year()));
        if (this.incomeView() === 'monthly') {
          this.incomeStatementMonthly.set(await this.reportsService.fetchIncomeStatementMonthly(this.year()));
        }
      } else {
        this.balanceSheet.set(await this.reportsService.fetchBalanceSheet(this.year()));
      }
    } finally {
      this.loading.set(false);
    }
  }
}
