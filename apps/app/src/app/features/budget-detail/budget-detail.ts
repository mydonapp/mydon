import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService } from '../../services/accounts.service';
import { BudgetDetail, BudgetProgressItem, BudgetsService } from '../../services/budgets.service';
import { CategoriesService } from '../../services/categories.service';
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
  readonly categoriesService = inject(CategoriesService);
  readonly accountsService = inject(AccountsService);
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
  editItems = signal<any[]>([]);
  editMode = signal(false);
  editName = signal('');
  editYear = signal(0);

  months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));

  categoryOptions = computed<ComboboxOption[]>(() =>
    this.categoriesService.categories().map((c) => ({ value: c.id, label: c.name })),
  );

  accountOptions = computed<ComboboxOption[]>(() =>
    this.accountsService.accounts().map((a) => ({ value: a.id, label: a.name })),
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
    this.categoriesService.fetchCategories();
    this.accountsService.fetchSimple();
  }

  async loadBudget(id: string) {
    this.loading.set(true);
    try {
      const b = await this.budgetsService.fetchBudget(id);
      this.budget.set(b);
      this.editItems.set(b.items.map((i) => ({ ...i })));
      this.editName.set(b.name);
      this.editYear.set(b.year);
      await this.loadProgress();
    } finally {
      this.loading.set(false);
    }
  }

  async loadProgress() {
    const b = this.budget();
    if (!b) return;
    this.progressLoading.set(true);
    try {
      const params: any = { viewType: this.viewType(), year: b.year };
      if (this.viewType() === 'monthly') params.month = this.selectedMonth();
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
    if (!b) return;
    this.editName.set(b.name);
    this.editYear.set(b.year);
    this.editItems.set(b.items.map((i) => ({ ...i })));
    this.editMode.set(true);
  }

  cancelEdit() {
    const b = this.budget();
    if (!b) return;
    this.editName.set(b.name);
    this.editYear.set(b.year);
    this.editItems.set(b.items.map((i) => ({ ...i })));
    this.editMode.set(false);
  }

  async saveAll() {
    const b = this.budget();
    if (!b) return;
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
      await this.budgetsService.upsertBudgetItems(b.id, this.editItems());
      this.toastService.success('Budget saved!');
      this.editMode.set(false);
      await this.loadBudget(b.id);
    } catch {
      this.toastService.error('Failed to save budget.');
    } finally {
      this.submitting.set(false);
    }
  }

  addItem() {
    this.editItems.update((items) => [
      ...items,
      { type: 'category', categoryId: undefined, accountId: undefined, amount: 0, frequency: 'monthly' },
    ]);
  }

  removeItem(index: number) {
    this.editItems.update((items) => items.filter((_, i) => i !== index));
  }
}
