import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AccountCodesService } from '../../services/account-codes.service';
import { AccountDetail, AccountsService } from '../../services/accounts.service';
import { CurrencyService } from '../../services/currency.service';
import { ListStyleService } from '../../services/list-style.service';
import { PrivacyService } from '../../services/privacy.service';
import { DetailHeaderComponent } from '../../shared/components/detail-header/detail-header';
import { IconComponent } from '../../shared/components/icon/icon';
import { ModalComponent } from '../../shared/components/modal/modal';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective } from '../../shared/directives/select.directive';
import { balanceColor } from '../../shared/utils/balance-color';

type AccountTransaction = {
  id: string;
  transactionDate: string;
  description: string;
  amount: number;
  counterAccount?: { id: string; name: string } | null;
  split?: boolean;
};

type RawAccountResponse = AccountDetail & {
  transactions?: AccountTransaction[];
};

@Component({
  selector: 'app-account',
  templateUrl: './account.html',
  styleUrl: './account.css',
  imports: [
    DatePipe,
    LowerCasePipe,
    FormsModule,
    TranslateModule,
    BtnDirective,
    InputDirective,
    SelectDirective,
    ModalComponent,
    IconComponent,
    DetailHeaderComponent,
    SkeletonComponent,
  ],
})
export class AccountComponent implements OnInit {
  accountsService = inject(AccountsService);
  currencyService = inject(CurrencyService);
  readonly listStyleService = inject(ListStyleService);
  privacyService = inject(PrivacyService);
  readonly accountCodesService = inject(AccountCodesService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  account = signal<AccountDetail | null>(null);
  transactions = signal<AccountTransaction[]>([]);
  filteredTransactions = signal<AccountTransaction[]>([]);
  selectedTx = signal<AccountTransaction | null>(null);
  searchText = '';
  page = signal(1);
  pageSize = 25;

  accountId = signal<string>('');

  year = signal(new Date().getFullYear().toString());

  yearOptions = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  paginationStart() {
    return (this.page() - 1) * this.pageSize + 1;
  }
  paginationEnd() {
    return Math.min(this.page() * this.pageSize, this.filteredTransactions().length);
  }
  paginatedTransactions() {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredTransactions().slice(start, start + this.pageSize);
  }

  ngOnInit() {
    this.accountId.set(this.route.snapshot.params['id']);
    this.loadData();
  }

  onYearChange(year: string) {
    this.year.set(year);
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const raw = (await this.accountsService.fetchAccount(this.accountId(), this.year())) as RawAccountResponse;
      const txs: AccountTransaction[] = raw.transactions ?? [];
      this.account.set(raw);
      this.transactions.set(txs);
      this.applyFilters();
    } finally {
      this.loading.set(false);
    }
  }

  txColor(tx: AccountTransaction): string {
    return balanceColor(this.account()?.type ?? '', tx.amount);
  }

  applyFilters() {
    const search = this.searchText.toLowerCase();
    this.filteredTransactions.set(
      this.transactions().filter(
        (tx) =>
          !search ||
          tx.description?.toLowerCase().includes(search) ||
          tx.counterAccount?.name?.toLowerCase().includes(search),
      ),
    );
    this.page.set(1);
  }

  /** Download the currently shown (year- and search-filtered) transactions as CSV. */
  exportCsv() {
    const account = this.account();
    const rows = this.filteredTransactions();
    if (!account || rows.length === 0) {
      return;
    }
    const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['Date', 'Description', 'Counter account', 'Amount', 'Currency'].join(','),
      ...rows.map((tx) =>
        [
          tx.transactionDate,
          escape(tx.description),
          escape(tx.counterAccount?.name ?? (tx.split ? 'Split' : '')),
          tx.amount,
          account.currency,
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${account.name}-${this.year()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
