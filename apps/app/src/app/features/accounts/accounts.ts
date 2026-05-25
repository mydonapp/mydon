import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AccountCodesService } from '../../services/account-codes.service';
import { AccountBalance, AccountsService } from '../../services/accounts.service';
import { CurrencyService } from '../../services/currency.service';
import { ForexService } from '../../services/forex.service';
import { LedgerService } from '../../services/ledger.service';
import { ListStyleService } from '../../services/list-style.service';
import { PrivacyService } from '../../services/privacy.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { ComboboxComponent } from '../../shared/components/combobox/combobox';
import { FieldComponent } from '../../shared/components/field/field';
import { IconComponent } from '../../shared/components/icon/icon';
import { ModalComponent } from '../../shared/components/modal/modal';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { balanceColor } from '../../shared/utils/balance-color';

interface AccountGroupRow {
  type: string;
  label: string;
  emptyLabel: string;
  accounts: AccountBalance[];
  total: number;
}

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
    SkeletonComponent,
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
  protected readonly accountCodesService = inject(AccountCodesService);
  protected readonly ledgerService = inject(LedgerService);
  private readonly forexService = inject(ForexService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);

  loading = signal(false);
  submitting = signal(false);
  rateLoading = signal(false);
  showCreateTransaction = signal(false);
  accountGroups = signal<AccountGroupRow[]>([]);

  newTransaction = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    creditAccountId: '',
    debitAccountId: '',
    creditAmount: '',
    debitAmount: '',
    creditFxRate: 1,
    debitFxRate: 1,
  };

  accountOptions() {
    return this.accountsService.accounts().map((a) => ({
      value: a.id,
      label: `${a.name} (${a.currency})`,
    }));
  }

  private accountCurrency(id: string): string | null {
    return this.accountsService.accounts().find((a) => a.id === id)?.currency ?? null;
  }

  baseCurrency(): string {
    return this.ledgerService.baseCurrency();
  }

  creditCurrency(): string | null {
    return this.newTransaction.creditAccountId ? this.accountCurrency(this.newTransaction.creditAccountId) : null;
  }

  debitCurrency(): string | null {
    return this.newTransaction.debitAccountId ? this.accountCurrency(this.newTransaction.debitAccountId) : null;
  }

  /** Both accounts chosen and their currencies differ → need a per-leg amount. */
  currenciesDiffer(): boolean {
    const c = this.creditCurrency();
    const d = this.debitCurrency();
    return !!c && !!d && c !== d;
  }

  creditNeedsRate(): boolean {
    const c = this.creditCurrency();
    return !!c && c !== this.baseCurrency();
  }

  debitNeedsRate(): boolean {
    const d = this.debitCurrency();
    return !!d && d !== this.baseCurrency();
  }

  /** A single shared amount field is enough when currencies match (the common case). */
  get singleAmount(): string {
    return this.newTransaction.creditAmount;
  }
  set singleAmount(value: string) {
    this.newTransaction.creditAmount = value;
    this.newTransaction.debitAmount = value;
  }

  /** When both legs share a non-base currency, one rate drives both sides. */
  get sharedFxRate(): number {
    return this.newTransaction.creditFxRate;
  }
  set sharedFxRate(value: number) {
    this.newTransaction.creditFxRate = value;
    this.newTransaction.debitFxRate = value;
  }

  creditBase(): number {
    return (Number(this.newTransaction.creditAmount) || 0) * this.newTransaction.creditFxRate;
  }

  debitBase(): number {
    return (Number(this.newTransaction.debitAmount) || 0) * this.newTransaction.debitFxRate;
  }

  balanceDelta(): number {
    return this.creditBase() - this.debitBase();
  }

  isBalanced(): boolean {
    return Math.abs(this.balanceDelta()) <= 0.01;
  }

  onCreditAccountChange(id: string): void {
    this.newTransaction.creditAccountId = id;
    this.onTransactionInputChanged();
  }

  onDebitAccountChange(id: string): void {
    this.newTransaction.debitAccountId = id;
    this.onTransactionInputChanged();
  }

  /** Re-fetch the per-leg rates to base whenever the accounts or the date change. */
  async onTransactionInputChanged(): Promise<void> {
    const credit = this.creditCurrency();
    const debit = this.debitCurrency();
    if (!credit || !debit) {
      return;
    }
    const base = this.baseCurrency();
    const date = this.newTransaction.date;
    this.rateLoading.set(true);
    try {
      this.newTransaction.creditFxRate = credit === base ? 1 : await this.forexService.getRate(credit, base, date);
      this.newTransaction.debitFxRate = debit === base ? 1 : await this.forexService.getRate(debit, base, date);
    } catch {
      // Leave whatever rate is there (default 1) editable; the user can still override.
      this.toastService.error('views.accounts.createTransactionForm.rateLoadError');
    } finally {
      this.rateLoading.set(false);
    }
    this.recomputeDebitAmount();
  }

  /** Keep the debit amount in sync so the two legs balance on the base currency. */
  recomputeDebitAmount(): void {
    if (!this.currenciesDiffer()) {
      this.newTransaction.debitAmount = this.newTransaction.creditAmount;
      return;
    }
    const creditAmount = Number(this.newTransaction.creditAmount);
    if (!creditAmount || !this.newTransaction.debitFxRate) {
      return;
    }
    const debit = (creditAmount * this.newTransaction.creditFxRate) / this.newTransaction.debitFxRate;
    this.newTransaction.debitAmount = (Math.round(debit * 100) / 100).toString();
  }

  async toggleListStyle() {
    const next = this.listStyleService.listStyle() === 'compact' ? 'normal' : 'compact';
    this.listStyleService.set(next);
    try {
      await this.userService.updatePreferences({ listStyle: next });
    } catch {
      // stub
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
          type: 'equity',
          label: 'words.equity',
          emptyLabel: 'views.accounts.noEquity',
          accounts: data.equity?.accounts ?? [],
          total: data.equity?.total ?? 0,
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
    const creditCurrency = this.creditCurrency();
    const debitCurrency = this.debitCurrency();
    const creditAmount = Number(this.newTransaction.creditAmount);
    const debitAmount = Number(this.newTransaction.debitAmount);
    if (!creditCurrency || !debitCurrency) {
      this.toastService.error('views.accounts.createTransactionForm.selectAccountsError');
      return;
    }
    if (!creditAmount || !debitAmount) {
      this.toastService.error('views.accounts.createTransactionForm.enterAmountsError');
      return;
    }
    if (!this.isBalanced()) {
      this.toastService.error('views.accounts.createTransactionForm.notBalancedError');
      return;
    }

    const base = this.baseCurrency();
    this.submitting.set(true);
    try {
      await this.accountsService.createTransaction({
        transactionDate: this.newTransaction.date,
        description: this.newTransaction.description,
        entries: [
          {
            accountId: this.newTransaction.creditAccountId,
            direction: 'CREDIT' as const,
            amount: creditAmount,
            currency: creditCurrency,
            fxRate: creditCurrency === base ? 1 : this.newTransaction.creditFxRate,
          },
          {
            accountId: this.newTransaction.debitAccountId,
            direction: 'DEBIT' as const,
            amount: debitAmount,
            currency: debitCurrency,
            fxRate: debitCurrency === base ? 1 : this.newTransaction.debitFxRate,
          },
        ],
      });
      this.toastService.success('views.accounts.createTransactionForm.success');
      this.showCreateTransaction.set(false);
      this.newTransaction = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        creditAccountId: '',
        debitAccountId: '',
        creditAmount: '',
        debitAmount: '',
        creditFxRate: 1,
        debitFxRate: 1,
      };
    } catch {
      this.toastService.error('views.accounts.createTransactionForm.error');
    } finally {
      this.submitting.set(false);
    }
  }
}
