import { Component, inject, signal, OnInit } from '@angular/core';
import { balanceColor } from '../../shared/utils/balance-color';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService } from '../../services/accounts.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { ListStyleService } from '../../services/list-style.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { FieldComponent } from '../../shared/components/field/field';
import { ModalComponent } from '../../shared/components/modal/modal';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';
import { ComboboxComponent } from '../../shared/components/combobox/combobox';
import { IconComponent } from '../../shared/components/icon/icon';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-accounts',
  imports: [
    RouterLink,
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BtnDirective,
    InputDirective,
    FieldComponent,
    ModalComponent,
    SpinnerComponent,
    ComboboxComponent,
    IconComponent,
  ],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css',
})
export class AccountsComponent implements OnInit {
  protected readonly accountsService = inject(AccountsService);
  protected readonly currencyService = inject(CurrencyService);
  protected readonly privacyService = inject(PrivacyService);
  protected readonly listStyleService = inject(ListStyleService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);

  loading = signal(false);
  submitting = signal(false);
  showCreateTransaction = signal(false);
  accountGroups = signal<any[]>([]);

  newTransaction = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    creditAccountId: '',
    debitAccountId: '',
    amount: '',
  };

  accountOptions() {
    return this.accountsService.accounts().map((a) => ({
      value: a.id,
      label: `${a.name} (${a.currency})`,
    }));
  }

  async toggleListStyle() {
    const next = this.listStyleService.listStyle() === 'compact' ? 'normal' : 'compact';
    this.listStyleService.set(next);
    try {
      await this.userService.updatePreferences({ listStyle: next });
    } catch (err) {
      console.error('toggleListStyle failed', err);
    }
  }

  ngOnInit() {
    this.accountsService.fetchSimple();
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

  balanceClass(type: string, value: number): string {
    return balanceColor(type, value);
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
