import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BudgetsService, BudgetDetail, BudgetItem, BudgetProgressItem } from '../../services/budgets.service';
import { CategoriesService } from '../../services/categories.service';
import { AccountsService } from '../../services/accounts.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { SelectDirective } from '../../shared/directives/select.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { ModalComponent } from '../../shared/components/modal/modal';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-budget-detail',
  templateUrl: './budget-detail.html',
  imports: [
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BtnDirective,
    SelectDirective,
    InputDirective,
    ModalComponent,
    SpinnerComponent,
    ProgressBarComponent,
    IconComponent,
  ],
})
export class BudgetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private budgetsService = inject(BudgetsService);
  categoriesService = inject(CategoriesService);
  accountsService = inject(AccountsService);
  currencyService = inject(CurrencyService);
  private toastService = inject(ToastService);

  Math = Math;

  loading = signal(false);
  progressLoading = signal(false);
  submitting = signal(false);
  showEditItems = signal(false);
  budget = signal<BudgetDetail | null>(null);
  progressItems = signal<BudgetProgressItem[]>([]);
  viewType = signal<'yearly' | 'monthly'>('yearly');
  selectedMonth = signal(new Date().getMonth() + 1);
  editItems = signal<any[]>([]);

  months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));

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

  addItem() {
    this.editItems.update((items) => [
      ...items,
      { type: 'category', categoryId: undefined, accountId: undefined, amount: 0, frequency: 'monthly' },
    ]);
  }

  removeItem(index: number) {
    this.editItems.update((items) => items.filter((_, i) => i !== index));
  }

  async saveItems() {
    const b = this.budget();
    if (!b) return;
    this.submitting.set(true);
    try {
      await this.budgetsService.upsertBudgetItems(b.id, this.editItems());
      this.toastService.success('Budget items saved!');
      this.showEditItems.set(false);
      await this.loadProgress();
    } catch {
      this.toastService.error('Failed to save budget items.');
    } finally {
      this.submitting.set(false);
    }
  }
}
