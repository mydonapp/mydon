import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService } from '../../services/accounts.service';
import { CurrencyService } from '../../services/currency.service';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { SelectDirective } from '../../shared/directives/select.directive';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    TranslateModule,
    BtnDirective,
    SelectDirective,
    SpinnerComponent,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  accountsService = inject(AccountsService);
  currencyService = inject(CurrencyService);

  loading = signal(false);
  summary = signal<any>(null);
  accounts = signal<any[]>([]);
  recentTransactions = signal<any[]>([]);

  yearOptions = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - i),
  );

  ngOnInit() {
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
      this.summary.set(data.summary ?? null);
      this.accounts.set(data.accounts ?? []);
      this.recentTransactions.set(data.recentTransactions ?? []);
    } catch {
      // silent
    } finally {
      this.loading.set(false);
    }
  }
}
