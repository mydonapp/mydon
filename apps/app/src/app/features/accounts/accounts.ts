import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService } from '../../services/accounts.service';
import { CategoriesService } from '../../services/categories.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BaseButtonComponent } from '../../shared/components/base-button/base-button';
import { BaseInputComponent } from '../../shared/components/base-input/base-input';
import { BaseSelectComponent, SelectOption } from '../../shared/components/base-select/base-select';
import { CategoryComboboxComponent } from '../../shared/components/category-combobox/category-combobox';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-accounts',
  imports: [
    RouterLink,
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BaseButtonComponent,
    BaseInputComponent,
    BaseSelectComponent,
    CategoryComboboxComponent,
  ],
  templateUrl: './accounts.html',
})
export class AccountsComponent implements OnInit {
  accountsService = inject(AccountsService);
  categoriesService = inject(CategoriesService);
  currencyService = inject(CurrencyService);
  privacyService = inject(PrivacyService);
  toastService = inject(ToastService);

  loading = signal(false);
  submitting = signal(false);
  showAddAccount = signal(false);
  showCreateTransaction = signal(false);
  accountGroups = signal<any[]>([]);

  newAccount = {
    name: '',
    type: 'assets',
    currency: 'CHF',
    openingBalance: '',
    categoryId: '',
  };

  newTransaction = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    creditAccountId: '',
    debitAccountId: '',
    amount: '',
  };

  yearOptions = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - i),
  );

  accountTypeOptions: SelectOption[] = [
    { value: 'assets', label: 'Assets' },
    { value: 'liabilities', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'income', label: 'Income' },
    { value: 'expenses', label: 'Expenses' },
  ];

  currencyOptions: SelectOption[] = [
    { value: 'CHF', label: 'CHF' },
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
    { value: 'GBP', label: 'GBP' },
    { value: 'KRW', label: 'KRW' },
  ];

  accountOptions() {
    return this.accountsService.accounts().map((a) => ({
      value: a.id,
      label: `${a.name} (${a.currency})`,
    }));
  }

  ngOnInit() {
    this.categoriesService.fetchCategories();
    this.accountsService.fetchSimple();
    this.loadData();
  }

  onYearChange(year: string) {
    this.accountsService.timeFilter.set(year);
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const data = await this.accountsService.fetchAccounts();
      const groups = [
        {
          type: 'assets',
          label: 'words.assets',
          emptyLabel: 'views.accounts.noAssets',
          accounts: data.assets?.accounts ?? [],
          total: data.assets?.total ?? 0,
        },
        {
          type: 'liabilities',
          label: 'words.liabilities',
          emptyLabel: 'views.accounts.noLiabilities',
          accounts: data.liabilities?.accounts ?? [],
          total: data.liabilities?.total ?? 0,
        },
        {
          type: 'income',
          label: 'words.income',
          emptyLabel: 'views.accounts.noIncome',
          accounts: data.income?.accounts ?? [],
          total: data.income?.total ?? 0,
        },
        {
          type: 'expenses',
          label: 'words.expenses',
          emptyLabel: 'views.accounts.noExpenses',
          accounts: data.expense?.accounts ?? [],
          total: data.expense?.total ?? 0,
        },
      ];
      this.accountGroups.set(groups);
    } finally {
      this.loading.set(false);
    }
  }

  balanceClass(type: string): string {
    switch (type) {
      case 'assets':
        return 'text-success';
      case 'liabilities':
        return 'text-error';
      case 'income':
        return 'text-success';
      case 'expenses':
        return 'text-error';
      default:
        return 'text-primary';
    }
  }

  async submitAddAccount() {
    if (!this.newAccount.name || !this.newAccount.type) return;
    this.submitting.set(true);
    try {
      await this.accountsService.createAccount({
        name: this.newAccount.name,
        type: this.newAccount.type,
        currency: this.newAccount.currency || 'CHF',
        openingBalance: this.newAccount.openingBalance
          ? Number(this.newAccount.openingBalance)
          : undefined,
        categoryId: this.newAccount.categoryId || undefined,
      });
      this.toastService.success('Account created successfully!');
      this.showAddAccount.set(false);
      this.newAccount = { name: '', type: 'assets', currency: 'CHF', openingBalance: '', categoryId: '' };
      await this.loadData();
    } catch {
      this.toastService.error('Failed to create account.');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitCreateTransaction() {
    this.submitting.set(true);
    try {
      await this.accountsService.createTransaction({
        date: this.newTransaction.date,
        description: this.newTransaction.description,
        creditAccountId: this.newTransaction.creditAccountId,
        debitAccountId: this.newTransaction.debitAccountId,
        amount: Number(this.newTransaction.amount),
      });
      this.toastService.success('Transaction created successfully!');
      this.showCreateTransaction.set(false);
      this.newTransaction = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        creditAccountId: '',
        debitAccountId: '',
        amount: '',
      };
    } catch {
      this.toastService.error('Failed to create transaction.');
    } finally {
      this.submitting.set(false);
    }
  }
}
