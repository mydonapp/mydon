import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyService } from '../../services/currency.service';
import { ListStyleService } from '../../services/list-style.service';
import { PrivacyService } from '../../services/privacy.service';
import { BalanceSheet, ReportsService, TrialBalance } from '../../services/reports.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { SelectDirective } from '../../shared/directives/select.directive';

type Tab = 'trialBalance' | 'balanceSheet';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.html',
  imports: [
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BtnDirective,
    SelectDirective,
    IconComponent,
    SkeletonComponent,
  ],
})
export class ReportsComponent implements OnInit {
  protected readonly currencyService = inject(CurrencyService);
  protected readonly listStyleService = inject(ListStyleService);
  protected readonly privacyService = inject(PrivacyService);
  private readonly reportsService = inject(ReportsService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  activeTab = signal<Tab>('trialBalance');
  year = signal(new Date().getFullYear().toString());
  loading = signal(false);
  downloading = signal(false);

  trialBalance = signal<TrialBalance | null>(null);
  balanceSheet = signal<BalanceSheet | null>(null);

  readonly years: string[] = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  ngOnInit() {
    this.load();
  }

  setTab(tab: Tab) {
    if (this.activeTab() === tab) {
      return;
    }
    this.activeTab.set(tab);
    this.load();
  }

  onYearChange(year: string) {
    this.year.set(year);
    this.trialBalance.set(null);
    this.balanceSheet.set(null);
    this.load();
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

  format(amount: number, currency: string): string {
    return this.privacyService.isPrivate() ? '···' : this.currencyService.format(amount, currency);
  }

  async download() {
    const report = this.activeTab() === 'trialBalance' ? 'trial-balance' : 'balance-sheet';
    this.downloading.set(true);
    try {
      await this.reportsService.downloadPdf(report, this.year());
    } catch {
      this.toastService.error('views.reports.downloadError');
    } finally {
      this.downloading.set(false);
    }
  }

  private async load() {
    this.loading.set(true);
    try {
      if (this.activeTab() === 'trialBalance') {
        this.trialBalance.set(await this.reportsService.fetchTrialBalance(this.year()));
      } else {
        this.balanceSheet.set(await this.reportsService.fetchBalanceSheet(this.year()));
      }
    } finally {
      this.loading.set(false);
    }
  }
}
