import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountGroup, AccountGroupsService } from '../../services/account-groups.service';
import { AccountSimple, AccountsService } from '../../services/accounts.service';
import { ListStyleService } from '../../services/list-style.service';
import { ToastService } from '../../services/toast.service';
import { AccountGroupComboboxComponent } from '../../shared/components/account-group-combobox/account-group-combobox';
import { FieldComponent } from '../../shared/components/field/field';
import { IconComponent } from '../../shared/components/icon/icon';
import { ModalComponent } from '../../shared/components/modal/modal';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ToggleComponent } from '../../shared/components/toggle/toggle';
import { CURRENCIES } from '../../shared/currency';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective, SelectOption } from '../../shared/directives/select.directive';

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
  protected readonly listStyleService = inject(ListStyleService);
  private accountsService = inject(AccountsService);
  private toastService = inject(ToastService);

  activeSection = signal<Section>('accounts');

  // ── Account Groups ─────────────────────────────────────────────────────
  creatingGroup = signal(false);
  updatingGroup = signal(false);

  showAddGroup = signal(false);
  newGroup = {
    name: '',
    code: '',
    parentId: '' as string,
  };

  showEditGroup = signal(false);
  editGroup = {
    id: '',
    name: '',
    code: '',
    parentId: '' as string,
  };

  // ── Accounts ────────────────────────────────────────────────────────────
  showInactive = false;
  activeTab = signal('all');
  allAccounts = signal<AccountSimple[]>([]);
  filteredAccounts = signal<AccountSimple[]>([]);
  updatingAcc = signal(false);

  showAddAccount = signal(false);
  submitting = signal(false);
  newAccount = { name: '', description: '', type: 'assets', currency: 'CHF', groupId: '' };

  showEditAccount = signal(false);
  editAcc = {
    id: '',
    name: '',
    description: '',
    groupId: '',
    code: '',
    activeFrom: '' as string,
    activeUntil: '' as string,
  };

  accountTabs = [
    { value: 'all', label: 'views.manage.accounts.all' },
    { value: 'assets', label: 'words.assets' },
    { value: 'liabilities', label: 'words.liabilities' },
    { value: 'equity', label: 'words.equity' },
    { value: 'income', label: 'words.income' },
    { value: 'expense', label: 'words.expenses' },
  ];

  accountTypeOptions: SelectOption[] = [
    { value: 'ASSETS', label: 'Assets' },
    { value: 'LIABILITIES', label: 'Liabilities' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'INCOME', label: 'Income' },
    { value: 'EXPENSE', label: 'Expenses' },
  ];

  currencyOptions: SelectOption[] = CURRENCIES.map((c) => ({ value: c, label: c }));

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
      accounts = accounts.filter((a) => a.type === this.activeTab().toUpperCase());
    }
    this.filteredAccounts.set(accounts);
  }

  async submitAddGroup() {
    if (!this.newGroup.name.trim()) {
      return;
    }
    this.creatingGroup.set(true);
    try {
      await this.accountGroupsService.createAccountGroup({
        name: this.newGroup.name.trim(),
        code: this.newGroup.code.trim(),
        parentId: this.newGroup.parentId || null,
      });
      this.toastService.success('views.manage.accountGroups.createSuccess');
      this.showAddGroup.set(false);
      this.newGroup = { name: '', code: '', parentId: '' };
    } catch {
      this.toastService.error('views.manage.accountGroups.createError');
    } finally {
      this.creatingGroup.set(false);
    }
  }

  startEditGroup(group: AccountGroup) {
    this.editGroup = {
      id: group.id,
      name: group.name,
      code: group.code ?? '',
      parentId: group.parentId ?? '',
    };
    this.showEditGroup.set(true);
  }

  /** Candidate parents = every group except the one being edited (no self-parent). */
  parentGroupOptions(): AccountGroup[] {
    const excludeId = this.showEditGroup() ? this.editGroup.id : '';
    return this.accountGroupsService.accountGroups().filter((g) => g.id !== excludeId);
  }

  async saveAccountGroup() {
    if (!this.editGroup.name.trim()) {
      return;
    }
    this.updatingGroup.set(true);
    try {
      await this.accountGroupsService.updateAccountGroup(this.editGroup.id, {
        name: this.editGroup.name.trim(),
        code: this.editGroup.code.trim(),
        parentId: this.editGroup.parentId || null,
      });
      this.toastService.success('views.manage.accountGroups.updateSuccess');
      this.showEditGroup.set(false);
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
      description: account.description ?? '',
      groupId: account.groupId ?? '',
      code: account.code ?? '',
      activeFrom: account.activeFrom ? account.activeFrom.substring(0, 10) : '',
      activeUntil: account.activeUntil ? account.activeUntil.substring(0, 10) : '',
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
        description: this.editAcc.description.trim(),
        groupId: this.editAcc.groupId || undefined,
        code: this.editAcc.code,
        activeFrom: this.editAcc.activeFrom ? new Date(this.editAcc.activeFrom).toISOString() : null,
        activeUntil: this.editAcc.activeUntil ? new Date(this.editAcc.activeUntil).toISOString() : null,
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

  async submitAddAccount() {
    if (!this.newAccount.name || !this.newAccount.type) {
      return;
    }
    this.submitting.set(true);
    try {
      await this.accountsService.createAccount({
        name: this.newAccount.name,
        description: this.newAccount.description.trim(),
        type: this.newAccount.type,
        currency: this.newAccount.currency || 'CHF',
        groupId: this.newAccount.groupId || undefined,
      });
      this.toastService.success('views.accounts.addAccountForm.success');
      this.showAddAccount.set(false);
      this.newAccount = { name: '', description: '', type: 'assets', currency: 'CHF', groupId: '' };
      await this.loadAccounts();
    } catch {
      this.toastService.error('views.accounts.addAccountForm.error');
    } finally {
      this.submitting.set(false);
    }
  }
}
