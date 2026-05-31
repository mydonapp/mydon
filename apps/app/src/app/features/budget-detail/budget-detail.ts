import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AccountCodesService } from '../../services/account-codes.service';
import { AccountGroupsService } from '../../services/account-groups.service';
import { AccountsService } from '../../services/accounts.service';
import {
  BudgetDetail,
  BudgetItem,
  BudgetProgressItem,
  BudgetsService,
  MonthlyBreakdown,
  MonthlyBreakdownItem,
} from '../../services/budgets.service';
import { CurrencyService } from '../../services/currency.service';
import { ListStyleService } from '../../services/list-style.service';
import { PrivacyService } from '../../services/privacy.service';
import { ToastService } from '../../services/toast.service';
import { ComboboxComponent, ComboboxOption } from '../../shared/components/combobox/combobox';
import { DetailHeaderComponent } from '../../shared/components/detail-header/detail-header';
import { IconComponent } from '../../shared/components/icon/icon';
import { ProgressBarComponent, ProgressBarVariant } from '../../shared/components/progress-bar/progress-bar';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective } from '../../shared/directives/select.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-budget-detail',
  templateUrl: './budget-detail.html',
  styleUrl: './budget-detail.css',
  imports: [
    FormsModule,
    TranslateModule,
    BtnDirective,
    SelectDirective,
    InputDirective,
    SkeletonComponent,
    ProgressBarComponent,
    IconComponent,
    ComboboxComponent,
    DetailHeaderComponent,
  ],
})
export class BudgetDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly budgetsService = inject(BudgetsService);
  readonly accountGroupsService = inject(AccountGroupsService);
  readonly accountsService = inject(AccountsService);
  readonly accountCodesService = inject(AccountCodesService);
  readonly currencyService = inject(CurrencyService);
  readonly listStyleService = inject(ListStyleService);
  readonly privacyService = inject(PrivacyService);
  private readonly toastService = inject(ToastService);

  Math = Math;

  loading = signal(false);
  progressLoading = signal(false);
  submitting = signal(false);
  budget = signal<BudgetDetail | null>(null);
  progressItems = signal<BudgetProgressItem[]>([]);
  monthly = signal<MonthlyBreakdown | null>(null);
  viewType = signal<'yearly' | 'monthly'>('yearly');
  editItems = signal<Omit<BudgetItem, 'id'>[]>([]);
  editMode = signal(false);
  editName = signal('');
  editYear = signal(0);
  /** Edit rows whose sub-item breakdown is expanded — keyed by the row object, which stays stable across signal updates. */
  expandedItems = signal(new Set<Omit<BudgetItem, 'id'>>());

  /** Short month labels (Jan–Dec) for the comparison matrix header; runtime locale, no i18n keys. */
  readonly monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'short' }),
  );

  groupOptions = computed<ComboboxOption[]>(() =>
    this.accountGroupsService.accountGroups().map((g) => ({
      value: g.id,
      label: this.accountCodesService.show() && g.code ? `${g.code} ${g.name}` : g.name,
    })),
  );

  accountOptions = computed<ComboboxOption[]>(() =>
    this.accountsService.accounts().map((a) => ({
      value: a.id,
      label: this.accountCodesService.show() && a.code ? `${a.code} ${a.name}` : a.name,
    })),
  );

  incomeItems = computed(() => this.progressItems().filter((i) => i.accountType === 'INCOME'));
  expenseItems = computed(() => this.progressItems().filter((i) => i.accountType !== 'INCOME'));

  incomeBudgeted = computed(() => this.incomeItems().reduce((sum, i) => sum + i.yearlyBudget, 0));
  incomeActual = computed(() => this.incomeItems().reduce((sum, i) => sum + i.actual, 0));
  expenseBudgeted = computed(() => this.expenseItems().reduce((sum, i) => sum + i.yearlyBudget, 0));
  expenseActual = computed(() => this.expenseItems().reduce((sum, i) => sum + i.actual, 0));
  netBudgeted = computed(() => this.incomeBudgeted() - this.expenseBudgeted());
  netActual = computed(() => this.incomeActual() - this.expenseActual());

  /** Share of the year covered by months that have data — drives the pace marker on yearly bars and the
   *  "through {month}" chip. Months with no transactions yet (e.g. the current month) don't count. */
  yearProgressPct = computed(() => Math.round((this.activeMonthsCount() / 12) * 100));
  throughMonthLabel = computed(() => {
    const i = this.lastActiveMonthIndex();
    return i >= 0 ? new Date(0, i).toLocaleString('default', { month: 'long' }) : '';
  });
  /** Annualized run-rate (current actual / elapsed months × 12); null before any month has elapsed. */
  incomeProjected = computed(() => this.annualize(this.incomeActual()));
  expenseProjected = computed(() => this.annualize(this.expenseActual()));
  netProjected = computed(() => this.annualize(this.netActual()));

  monthlyIncomeItems = computed(() => this.monthly()?.items.filter((i) => i.accountType === 'INCOME') ?? []);
  monthlyExpenseItems = computed(() => this.monthly()?.items.filter((i) => i.accountType !== 'INCOME') ?? []);
  monthlyIncomeTotals = computed(() => this.sumMonths(this.monthlyIncomeItems()));
  monthlyExpenseTotals = computed(() => this.sumMonths(this.monthlyExpenseItems()));
  monthlyNetTotals = computed(() =>
    this.monthlyIncomeTotals().map((v, i) => Math.round((v - this.monthlyExpenseTotals()[i]) * 100) / 100),
  );

  /** Months that have at least one non-zero value across all items — the shared divisor for averages
   *  and projections. A month is skipped only when every line is 0 (e.g. the not-yet-booked current month). */
  activeMonthsCount = computed(() => {
    const m = this.monthly();
    if (!m) {
      return 0;
    }
    let count = 0;
    for (let i = 0; i < 12; i++) {
      if (m.items.some((it) => it.months[i])) {
        count += 1;
      }
    }
    return count;
  });

  /** Index (0 = Jan) of the latest month that has any data — the month the pace chip reads "through". */
  lastActiveMonthIndex = computed(() => {
    const m = this.monthly();
    if (!m) {
      return -1;
    }
    for (let i = 11; i >= 0; i--) {
      if (m.items.some((it) => it.months[i])) {
        return i;
      }
    }
    return -1;
  });

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadBudget(id);
    this.accountGroupsService.fetchAccountGroups();
    this.accountsService.fetchSimple();
  }

  async loadBudget(id: string) {
    this.loading.set(true);
    try {
      const b = await this.budgetsService.fetchBudget(id);
      this.budget.set(b);
      this.editItems.set(this.cloneItemsForEdit(b));
      this.editName.set(b.name);
      this.editYear.set(b.year);
      await this.loadProgress();
    } finally {
      this.loading.set(false);
    }
  }

  async loadProgress() {
    const b = this.budget();
    if (!b) {
      return;
    }
    this.progressLoading.set(true);
    try {
      // Yearly progress powers the summary cards, pace bars and YTD chip.
      const progress = await this.budgetsService.fetchProgress(b.id, { viewType: 'yearly', year: b.year });
      this.progressItems.set(progress.items);
    } catch {
      this.progressItems.set([]);
    } finally {
      this.progressLoading.set(false);
    }

    // The 12-month matrix backs the comparison view + the "months with data" divisor for averages and
    // projections. Load it independently so a failure here never blanks the items above.
    try {
      this.monthly.set(await this.budgetsService.fetchMonthlyBreakdown(b.id, b.year));
    } catch {
      this.monthly.set(null);
    }
  }

  /** Project a year-to-date actual to a full-year figure from the run-rate over months that have data. */
  private annualize(actual: number): number | null {
    const months = this.activeMonthsCount();
    return months > 0 ? Math.round((actual / months) * 12 * 100) / 100 : null;
  }

  /** Per-item year-end projection — uses months-with-data (like the summary cards), not the calendar
   *  month, so an empty current month doesn't drag the run-rate down. */
  projected(item: BudgetProgressItem): number | null {
    return this.annualize(item.actual);
  }

  /** Remaining yearly budget (negative = over budget). */
  remaining(item: BudgetProgressItem): number {
    return Math.round((item.yearlyBudget - item.actual) * 100) / 100;
  }

  /** Bar colour judged against time-elapsed pace rather than a fixed threshold. Income is "good when
   *  ahead", expense is "good when behind", so the comparison is inverted by account type. */
  paceVariant(item: BudgetProgressItem): ProgressBarVariant {
    const pace = (this.activeMonthsCount() / 12) * 100;
    const pct = item.percentage;
    if (item.accountType === 'INCOME') {
      if (pace <= 0 || pct >= pace * 0.95) {
        return 'success';
      }
      return pct >= pace * 0.8 ? 'warning' : 'error';
    }
    if (pct <= pace) {
      return 'success';
    }
    return pct <= pace * 1.1 ? 'warning' : 'error';
  }

  /** Highlight a matrix cell only when it exceeds its monthly budget: green for income (good), red for expense. */
  cellClass(value: number, monthlyBudget: number, accountType: string | null): string {
    if (monthlyBudget <= 0 || value <= 0 || value <= monthlyBudget) {
      return '';
    }
    return accountType === 'INCOME' ? 'text-income font-medium' : 'text-error font-medium';
  }

  /** Matrix number formatted for display: masked under privacy mode, '·' for empty months. */
  num(value: number, maxDecimals = 0, blankZero = true): string {
    if (this.privacyService.isPrivate()) {
      return '···';
    }
    if (blankZero && !value) {
      return '·';
    }
    return value.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals });
  }

  /** Average over months that have any data (shared divisor across all rows). A category can legitimately
   *  be 0 in an active month, so we divide by the month count where *some* line has a value. */
  monthlyAvg(months: number[]): number {
    const divisor = this.activeMonthsCount();
    if (divisor === 0) {
      return 0;
    }
    const sum = months.reduce((s, m) => s + (m ?? 0), 0);
    return Math.round((sum / divisor) * 100) / 100;
  }

  private sumMonths(items: MonthlyBreakdownItem[]): number[] {
    const totals = new Array<number>(12).fill(0);
    for (const it of items) {
      for (let m = 0; m < 12; m++) {
        totals[m] += it.months[m] ?? 0;
      }
    }
    return totals.map((v) => Math.round(v * 100) / 100);
  }

  enterEditMode() {
    const b = this.budget();
    if (!b) {
      return;
    }
    this.editName.set(b.name);
    this.editYear.set(b.year);
    this.editItems.set(this.cloneItemsForEdit(b));
    this.editMode.set(true);
  }

  cancelEdit() {
    const b = this.budget();
    if (!b) {
      return;
    }
    this.editName.set(b.name);
    this.editYear.set(b.year);
    this.editItems.set(this.cloneItemsForEdit(b));
    this.editMode.set(false);
  }

  async saveAll() {
    const b = this.budget();
    if (!b) {
      return;
    }
    this.submitting.set(true);
    try {
      const nameChanged = this.editName() !== b.name;
      const yearChanged = this.editYear() !== b.year;
      if (nameChanged || yearChanged) {
        await this.budgetsService.updateBudget(b.id, {
          ...(nameChanged ? { name: this.editName() } : {}),
          ...(yearChanged ? { year: this.editYear() } : {}),
        });
      }

      const payload = this.editItems().map((item) => {
        const subItems = (item.subItems ?? []).filter((s) => s.name.trim().length > 0);
        return { ...item, subItems: subItems.length > 0 ? subItems : undefined };
      });
      await this.budgetsService.upsertBudgetItems(b.id, payload);
      this.toastService.success('views.budgets.saveSuccess');
      this.editMode.set(false);
      await this.loadBudget(b.id);
    } catch {
      this.toastService.error('views.budgets.saveError');
    } finally {
      this.submitting.set(false);
    }
  }

  addItem() {
    this.editItems.update((items) => [
      ...items,
      { type: 'group', groupId: undefined, accountId: undefined, amount: 0, frequency: 'monthly' },
    ]);
  }

  removeItem(index: number) {
    this.editItems.update((items) => items.filter((_, i) => i !== index));
  }

  isExpanded(item: Omit<BudgetItem, 'id'>): boolean {
    return this.expandedItems().has(item);
  }

  toggleExpanded(item: Omit<BudgetItem, 'id'>) {
    this.expandedItems.update((set) => {
      const next = new Set(set);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }

  isComputed(item: Omit<BudgetItem, 'id'>): boolean {
    return (item.subItems?.length ?? 0) > 0;
  }

  /** Exact yearly total of the sub-items. A line with sub-items is always yearly (see addSubItem), so
   *  summing yearly-equivalents directly avoids the monthly-then-×12 rounding drift. */
  computeLineAmount(item: Omit<BudgetItem, 'id'>): number {
    const yearly = (item.subItems ?? []).reduce(
      (acc, sub) => acc + (sub.frequency === 'yearly' ? sub.amount : sub.amount * 12),
      0,
    );
    return Math.round(yearly * 100) / 100;
  }

  addSubItem(index: number) {
    this.editItems.update((items) => {
      const item = items[index];
      // A line defined by sub-items is canonically yearly (its own amount/frequency are derived, not edited).
      item.frequency = 'yearly';
      item.subItems = [...(item.subItems ?? []), { name: '', amount: 0, frequency: 'monthly' }];
      item.amount = this.computeLineAmount(item);
      return [...items];
    });
  }

  removeSubItem(index: number, subIndex: number) {
    this.editItems.update((items) => {
      const item = items[index];
      item.subItems = (item.subItems ?? []).filter((_, i) => i !== subIndex);
      item.amount = this.computeLineAmount(item);
      return [...items];
    });
  }

  onSubItemChange(index: number) {
    this.editItems.update((items) => {
      items[index].amount = this.computeLineAmount(items[index]);
      return [...items];
    });
  }

  private cloneItemsForEdit(b: BudgetDetail): Omit<BudgetItem, 'id'>[] {
    return b.items.map((i) => ({ ...i, subItems: i.subItems?.map((s) => ({ ...s })) }));
  }
}
