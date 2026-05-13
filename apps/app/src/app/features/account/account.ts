import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { balanceColor } from '../../shared/utils/balance-color';
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
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-account',
  templateUrl: './account.html',
  styleUrl: './account.css',
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
    IconComponent,
  ],
})
export class AccountComponent implements OnInit {
  accountsService = inject(AccountsService);
  currencyService = inject(CurrencyService);
  privacyService = inject(PrivacyService);
  private route = inject(ActivatedRoute);

  scrollY = signal(0);
  isScrolled = computed(() => this.scrollY() > 20);
  isScrolling = computed(() => this.scrollY() > 5);

  @HostListener('window:scroll')
  onScroll() { this.scrollY.set(window.scrollY); }

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
      const raw: any = await this.accountsService.fetchAccount(this.accountId());
      const txs: any[] = raw.transactions ?? [];
      this.account.set({
        ...raw,
        totalTransactions: txs.length,
        totalCredit: (raw.creditTransactions ?? []).reduce((s: number, t: any) => s + Number(t.creditAmount), 0),
        totalDebit: (raw.debitTransactions ?? []).reduce((s: number, t: any) => s + Number(t.debitAmount), 0),
      });
      this.transactions.set(txs);
      this.applyFilters();
    } finally {
      this.loading.set(false);
    }
  }

  txColor(tx: any): string {
    return balanceColor(this.account()?.type ?? '', tx.amount);
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
