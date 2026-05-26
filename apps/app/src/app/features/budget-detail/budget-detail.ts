import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AccountCodesService } from '../../services/account-codes.service';
import { AccountGroupsService } from '../../services/account-groups.service';
import { AccountsService } from '../../services/accounts.service';
import { BudgetDetail, BudgetItem, BudgetProgressItem, BudgetsService } from '../../services/budgets.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';
import { ComboboxComponent, ComboboxOption } from '../../shared/components/combobox/combobox';
import { DetailHeaderComponent } from '../../shared/components/detail-header/detail-header';
import { IconComponent } from '../../shared/components/icon/icon';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective } from '../../shared/directives/select.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-budget-detail',
  templateUrl: './budget-detail.html',
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
  private readonly toastService = inject(ToastService);

  Math = Math;

  loading = signal(false);
  progressLoading = signal(false);
  submitting = signal(false);
  budget = signal<BudgetDetail | null>(null);
  progressItems = signal<BudgetProgressItem[]>([]);
  viewType = signal<'yearly' | 'monthly'>('yearly');
  selectedMonth = signal(new Date().getMonth() + 1);
  editItems = signal<Omit<BudgetItem, 'id'>[]>([]);
  editMode = signal(false);
  editName = signal('');
  editYear = signal(0);
  /** Edit rows whose sub-item breakdown is expanded — keyed by the row object, which stays stable across signal updates. */
  expandedItems = signal(new Set<Omit<BudgetItem, 'id'>>());

  months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));

  groupOptions = computed<ComboboxOption[]>(() =>
    this.accountGroupsService.accountGroups().map((g) => ({ value: g.id, label: g.name })),
  );

  accountOptions = computed<ComboboxOption[]>(() =>
    this.accountsService.accounts().map((a) => ({
      value: a.id,
      label: this.accountCodesService.show() && a.code ? `${a.code} ${a.name}` : a.name,
    })),
  );

  incomeItems = computed(() => this.progressItems().filter((i) => i.accountType === 'INCOME'));
  expenseItems = computed(() => this.progressItems().filter((i) => i.accountType !== 'INCOME'));

  incomeBudgeted = computed(() =>
    this.incomeItems().reduce((sum, i) => sum + (this.viewType() === 'monthly' ? i.monthlyBudget : i.yearlyBudget), 0),
  );
  incomeActual = computed(() => this.incomeItems().reduce((sum, i) => sum + i.actual, 0));
  expenseBudgeted = computed(() =>
    this.expenseItems().reduce((sum, i) => sum + (this.viewType() === 'monthly' ? i.monthlyBudget : i.yearlyBudget), 0),
  );
  expenseActual = computed(() => this.expenseItems().reduce((sum, i) => sum + i.actual, 0));
  netBudgeted = computed(() => this.incomeBudgeted() - this.expenseBudgeted());
  netActual = computed(() => this.incomeActual() - this.expenseActual());

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
      const params: { viewType: 'yearly' | 'monthly'; year: number; month?: number } = {
        viewType: this.viewType(),
        year: b.year,
      };
      if (this.viewType() === 'monthly') {
        params.month = this.selectedMonth();
      }
      const progress = await this.budgetsService.fetchProgress(b.id, params);
      this.progressItems.set(progress.items);
    } catch {
      this.progressItems.set([]);
    } finally {
      this.progressLoading.set(false);
    }
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

  computeLineAmount(item: Omit<BudgetItem, 'id'>): number {
    const sum = (item.subItems ?? []).reduce((acc, sub) => {
      const monthly = sub.frequency === 'monthly' ? sub.amount : sub.amount / 12;
      return acc + (item.frequency === 'monthly' ? monthly : monthly * 12);
    }, 0);
    return Math.round(sum * 100) / 100;
  }

  addSubItem(index: number) {
    this.editItems.update((items) => {
      const item = items[index];
      item.subItems = [...(item.subItems ?? []), { name: '', amount: 0, frequency: item.frequency }];
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

  onLineFrequencyChange(index: number) {
    this.editItems.update((items) => {
      const item = items[index];
      if (this.isComputed(item)) {
        item.amount = this.computeLineAmount(item);
      }
      return [...items];
    });
  }

  private cloneItemsForEdit(b: BudgetDetail): Omit<BudgetItem, 'id'>[] {
    return b.items.map((i) => ({ ...i, subItems: i.subItems?.map((s) => ({ ...s })) }));
  }
}
