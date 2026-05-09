import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BudgetsService, BudgetSummary } from '../../services/budgets.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BaseButtonComponent } from '../../shared/components/base-button/base-button';
import { BaseInputComponent } from '../../shared/components/base-input/base-input';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.html',
  imports: [
    RouterLink,
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BaseButtonComponent,
    BaseInputComponent,
  ],
})
export class BudgetsComponent implements OnInit {
  private budgetsService = inject(BudgetsService);
  private toastService = inject(ToastService);

  loading = signal(false);
  submitting = signal(false);
  showCreate = signal(false);
  budgets = signal<BudgetSummary[]>([]);
  budgetToDelete = signal<BudgetSummary | null>(null);

  newBudget = {
    name: '',
    year: String(new Date().getFullYear()),
  };

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      this.budgets.set(await this.budgetsService.fetchBudgets());
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(budget: BudgetSummary) {
    this.budgetToDelete.set(budget);
  }

  async deleteBudget() {
    const budget = this.budgetToDelete();
    if (!budget) return;
    this.submitting.set(true);
    try {
      await this.budgetsService.deleteBudget(budget.id);
      this.toastService.success('Budget deleted.');
      this.budgetToDelete.set(null);
      await this.loadData();
    } catch {
      this.toastService.error('Failed to delete budget.');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitCreate() {
    if (!this.newBudget.name || !this.newBudget.year) return;
    this.submitting.set(true);
    try {
      await this.budgetsService.createBudget({
        name: this.newBudget.name,
        year: Number(this.newBudget.year),
      });
      this.toastService.success('Budget created!');
      this.showCreate.set(false);
      this.newBudget = { name: '', year: String(new Date().getFullYear()) };
      await this.loadData();
    } catch {
      this.toastService.error('Failed to create budget.');
    } finally {
      this.submitting.set(false);
    }
  }
}
