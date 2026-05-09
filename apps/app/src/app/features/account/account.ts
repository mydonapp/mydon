import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService } from '../../services/accounts.service';
import { CurrencyService } from '../../services/currency.service';
import { PrivacyService } from '../../services/privacy.service';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective } from '../../shared/directives/select.directive';
import { ModalComponent } from '../../shared/components/modal/modal';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-account',
  templateUrl: './account.html',
  imports: [
    DatePipe,
    LowerCasePipe,
    RouterLink,
    FormsModule,
    TranslateModule,
    BtnDirective,
    InputDirective,
    SelectDirective,
    ModalComponent,
    SpinnerComponent,
    IconComponent,
  ],
})
export class AccountComponent implements OnInit {
  accountsService = inject(AccountsService);
  currencyService = inject(CurrencyService);
  privacyService = inject(PrivacyService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  account = signal<any>(null);
  transactions = signal<any[]>([]);
  filteredTransactions = signal<any[]>([]);
  selectedTx = signal<any>(null);
  searchText = '';
  page = signal(1);
  pageSize = 25;

  accountId = signal<string>('');

  yearOptions = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - i),
  );

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
    this.accountsService.timeFilter.set(year);
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [account, txData] = await Promise.all([
        this.accountsService.fetchAccount(this.accountId()),
        this.accountsService.fetchTransactions(this.accountId()),
      ]);
      this.account.set(account);
      this.transactions.set(txData.transactions ?? txData ?? []);
      this.applyFilters();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    const search = this.searchText.toLowerCase();
    this.filteredTransactions.set(
      this.transactions().filter(
        (tx) =>
          !search ||
          tx.description?.toLowerCase().includes(search) ||
          tx.creditAccountName?.toLowerCase().includes(search) ||
          tx.debitAccountName?.toLowerCase().includes(search),
      ),
    );
    this.page.set(1);
  }
}
