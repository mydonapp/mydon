import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CategoriesService, Category } from '../../services/categories.service';
import { AccountsService } from '../../services/accounts.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective, SelectOption } from '../../shared/directives/select.directive';
import { FieldComponent } from '../../shared/components/field/field';
import { ModalComponent } from '../../shared/components/modal/modal';
import { ToggleComponent } from '../../shared/components/toggle/toggle';
import { IconComponent } from '../../shared/components/icon/icon';
import { CategoryComboboxComponent } from '../../shared/components/category-combobox/category-combobox';

type Section = 'accounts' | 'categories';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.html',
  styleUrl: './manage.css',
  imports: [
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BtnDirective,
    InputDirective,
    SelectDirective,
    FieldComponent,
    ModalComponent,
    ToggleComponent,
    IconComponent,
    CategoryComboboxComponent,
  ],
})
export class ManageComponent implements OnInit {
  categoriesService = inject(CategoriesService);
  private accountsService = inject(AccountsService);
  private toastService = inject(ToastService);

  activeSection = signal<Section>('accounts');

  // ── Categories ─────────────────────────────────────────────────────────
  newCategoryName = '';
  creatingCat = signal(false);
  editingCatId = signal<string | null>(null);
  editCatName = '';
  updatingCat = signal(false);

  // ── Accounts ────────────────────────────────────────────────────────────
  showInactive = false;
  activeTab = signal('all');
  allAccounts = signal<any[]>([]);
  filteredAccounts = signal<any[]>([]);
  editingAccId = signal<string | null>(null);
  editAccName = '';
  updatingAcc = signal(false);
  togglingAcc = signal<string | null>(null);

  showAddAccount = signal(false);
  submitting = signal(false);
  newAccount = { name: '', type: 'assets', currency: 'CHF', openingBalance: '', categoryId: '' };

  accountTabs = [
    { value: 'all', label: 'views.manage.accounts.all' },
    { value: 'assets', label: 'words.assets' },
    { value: 'liabilities', label: 'words.liabilities' },
    { value: 'income', label: 'words.income' },
    { value: 'expenses', label: 'words.expenses' },
  ];

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

  ngOnInit() {
    this.categoriesService.fetchCategories();
    this.loadAccounts();
  }

  async loadAccounts() {
    await this.accountsService.fetchSimple();
    this.allAccounts.set(this.accountsService.accounts());
    this.filterAccounts();
  }

  filterAccounts() {
    let accounts = this.allAccounts();
    if (!this.showInactive) accounts = accounts.filter((a) => a.isActive);
    if (this.activeTab() !== 'all') {
      accounts = accounts.filter((a) => a.type === this.activeTab());
    }
    this.filteredAccounts.set(accounts);
  }

  async createCategory() {
    if (!this.newCategoryName.trim()) return;
    this.creatingCat.set(true);
    try {
      await this.categoriesService.createCategory(this.newCategoryName.trim());
      this.toastService.success('views.manage.categories.createSuccess');
      this.newCategoryName = '';
    } catch {
      this.toastService.error('views.manage.categories.createError');
    } finally {
      this.creatingCat.set(false);
    }
  }

  startEditCat(cat: Category) {
    this.editingCatId.set(cat.id);
    this.editCatName = cat.name;
  }

  async saveCategory(cat: Category) {
    if (!this.editCatName.trim()) return;
    this.updatingCat.set(true);
    try {
      await this.categoriesService.updateCategory(cat.id, this.editCatName.trim());
      this.toastService.success('views.manage.categories.updateSuccess');
      this.editingCatId.set(null);
    } catch {
      this.toastService.error('views.manage.categories.updateError');
    } finally {
      this.updatingCat.set(false);
    }
  }

  startEditAcc(account: any) {
    this.editingAccId.set(account.id);
    this.editAccName = account.name;
  }

  async saveAccount(account: any) {
    if (!this.editAccName.trim()) return;
    this.updatingAcc.set(true);
    try {
      await this.accountsService.updateAccount(account.id, { name: this.editAccName.trim() });
      this.toastService.success('views.manage.accounts.updateSuccess');
      this.editingAccId.set(null);
      await this.loadAccounts();
    } catch {
      this.toastService.error('views.manage.accounts.updateError');
    } finally {
      this.updatingAcc.set(false);
    }
  }

  async toggleAccount(account: any) {
    this.togglingAcc.set(account.id);
    try {
      await this.accountsService.updateAccount(account.id, { isActive: !account.isActive });
      const msg = account.isActive
        ? 'views.manage.accounts.deactivateSuccess'
        : 'views.manage.accounts.activateSuccess';
      this.toastService.success(msg);
      await this.loadAccounts();
    } catch {
      this.toastService.error('views.manage.accounts.updateError');
    } finally {
      this.togglingAcc.set(null);
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
      this.toastService.success('views.accounts.addAccountForm.success');
      this.showAddAccount.set(false);
      this.newAccount = { name: '', type: 'assets', currency: 'CHF', openingBalance: '', categoryId: '' };
      await this.loadAccounts();
    } catch {
      this.toastService.error('views.accounts.addAccountForm.error');
    } finally {
      this.submitting.set(false);
    }
  }
}
