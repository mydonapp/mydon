import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountGroup, AccountGroupsService } from '../../services/account-groups.service';
import { AccountSimple, AccountsService } from '../../services/accounts.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective, SelectOption } from '../../shared/directives/select.directive';
import { FieldComponent } from '../../shared/components/field/field';
import { ModalComponent } from '../../shared/components/modal/modal';
import { ToggleComponent } from '../../shared/components/toggle/toggle';
import { IconComponent } from '../../shared/components/icon/icon';
import { AccountGroupComboboxComponent } from '../../shared/components/account-group-combobox/account-group-combobox';

type Section = 'accounts' | 'accountGroups';

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
    AccountGroupComboboxComponent,
  ],
})
export class ManageComponent implements OnInit {
  accountGroupsService = inject(AccountGroupsService);
  private accountsService = inject(AccountsService);
  private toastService = inject(ToastService);

  activeSection = signal<Section>('accounts');

  // ── Account Groups ─────────────────────────────────────────────────────
  newGroupName = '';
  creatingGroup = signal(false);
  editingGroupId = signal<string | null>(null);
  editGroupName = '';
  updatingGroup = signal(false);

  // ── Accounts ────────────────────────────────────────────────────────────
  showInactive = false;
  activeTab = signal('all');
  allAccounts = signal<AccountSimple[]>([]);
  filteredAccounts = signal<AccountSimple[]>([]);
  updatingAcc = signal(false);
  togglingAcc = signal<string | null>(null);

  showAddAccount = signal(false);
  submitting = signal(false);
  newAccount = { name: '', type: 'assets', currency: 'CHF', openingBalance: '', groupId: '' };

  showEditAccount = signal(false);
  editAcc = { id: '', name: '', groupId: '', openingBalance: 0, accountNumber: null as number | null };

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
    this.accountGroupsService.fetchAccountGroups();
    this.loadAccounts();
  }

  async loadAccounts() {
    await this.accountsService.fetchSimple();
    this.allAccounts.set(this.accountsService.accounts());
    this.filterAccounts();
  }

  filterAccounts() {
    let accounts = this.allAccounts();
    if (!this.showInactive) {
      accounts = accounts.filter((a) => a.isActive);
    }
    if (this.activeTab() !== 'all') {
      accounts = accounts.filter((a) => a.type === this.activeTab());
    }
    this.filteredAccounts.set(accounts);
  }

  async createAccountGroup() {
    if (!this.newGroupName.trim()) {
      return;
    }
    this.creatingGroup.set(true);
    try {
      await this.accountGroupsService.createAccountGroup({ name: this.newGroupName.trim() });
      this.toastService.success('views.manage.accountGroups.createSuccess');
      this.newGroupName = '';
    } catch {
      this.toastService.error('views.manage.accountGroups.createError');
    } finally {
      this.creatingGroup.set(false);
    }
  }

  startEditGroup(group: AccountGroup) {
    this.editingGroupId.set(group.id);
    this.editGroupName = group.name;
  }

  async saveAccountGroup(group: AccountGroup) {
    if (!this.editGroupName.trim()) {
      return;
    }
    this.updatingGroup.set(true);
    try {
      await this.accountGroupsService.updateAccountGroup(group.id, { name: this.editGroupName.trim() });
      this.toastService.success('views.manage.accountGroups.updateSuccess');
      this.editingGroupId.set(null);
    } catch {
      this.toastService.error('views.manage.accountGroups.updateError');
    } finally {
      this.updatingGroup.set(false);
    }
  }

  startEditAcc(account: AccountSimple) {
    this.editAcc = {
      id: account.id,
      name: account.name,
      groupId: account.groupId ?? '',
      openingBalance: account.openingBalance ?? 0,
      accountNumber: account.accountNumber ?? null,
    };
    this.showEditAccount.set(true);
  }

  async saveAccount() {
    if (!this.editAcc.name.trim()) {
      return;
    }
    this.updatingAcc.set(true);
    try {
      await this.accountsService.updateAccount(this.editAcc.id, {
        name: this.editAcc.name.trim(),
        groupId: this.editAcc.groupId || undefined,
        openingBalance: this.editAcc.openingBalance,
        accountNumber: this.editAcc.accountNumber,
      });
      this.toastService.success('views.manage.accounts.updateSuccess');
      this.showEditAccount.set(false);
      await this.loadAccounts();
    } catch {
      this.toastService.error('views.manage.accounts.updateError');
    } finally {
      this.updatingAcc.set(false);
    }
  }

  async toggleAccount(account: AccountSimple) {
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
    if (!this.newAccount.name || !this.newAccount.type) {
      return;
    }
    this.submitting.set(true);
    try {
      await this.accountsService.createAccount({
        name: this.newAccount.name,
        type: this.newAccount.type,
        currency: this.newAccount.currency || 'CHF',
        openingBalance: this.newAccount.openingBalance ? Number(this.newAccount.openingBalance) : undefined,
        groupId: this.newAccount.groupId || undefined,
      });
      this.toastService.success('views.accounts.addAccountForm.success');
      this.showAddAccount.set(false);
      this.newAccount = { name: '', type: 'assets', currency: 'CHF', openingBalance: '', groupId: '' };
      await this.loadAccounts();
    } catch {
      this.toastService.error('views.accounts.addAccountForm.error');
    } finally {
      this.submitting.set(false);
    }
  }
}
