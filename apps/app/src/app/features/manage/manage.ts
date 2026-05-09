import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CategoriesService, Category } from '../../services/categories.service';
import { AccountsService } from '../../services/accounts.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BaseButtonComponent } from '../../shared/components/base-button/base-button';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.html',
  imports: [
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BaseButtonComponent,
  ],
})
export class ManageComponent implements OnInit {
  categoriesService = inject(CategoriesService);
  private accountsService = inject(AccountsService);
  private toastService = inject(ToastService);

  newCategoryName = '';
  creatingCat = signal(false);
  editingCatId = signal<string | null>(null);
  editCatName = '';
  updatingCat = signal(false);

  showInactive = false;
  activeTab = signal('all');
  allAccounts = signal<any[]>([]);
  filteredAccounts = signal<any[]>([]);
  editingAccId = signal<string | null>(null);
  editAccName = '';
  updatingAcc = signal(false);
  togglingAcc = signal<string | null>(null);

  accountTabs = [
    { value: 'all', label: 'views.manage.accounts.all' },
    { value: 'assets', label: 'words.assets' },
    { value: 'liabilities', label: 'words.liabilities' },
    { value: 'income', label: 'words.income' },
    { value: 'expenses', label: 'words.expenses' },
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
      this.toastService.success('Category created.');
      this.newCategoryName = '';
    } catch {
      this.toastService.error('Failed to create category.');
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
      this.toastService.success('Category updated.');
      this.editingCatId.set(null);
    } catch {
      this.toastService.error('Failed to update category.');
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
      this.toastService.success('Account updated.');
      this.editingAccId.set(null);
      await this.loadAccounts();
    } catch {
      this.toastService.error('Failed to update account.');
    } finally {
      this.updatingAcc.set(false);
    }
  }

  async toggleAccount(account: any) {
    this.togglingAcc.set(account.id);
    try {
      await this.accountsService.updateAccount(account.id, { isActive: !account.isActive });
      const msg = account.isActive ? 'Account deactivated.' : 'Account activated.';
      this.toastService.success(msg);
      await this.loadAccounts();
    } catch {
      this.toastService.error('Failed to update account.');
    } finally {
      this.togglingAcc.set(null);
    }
  }
}
