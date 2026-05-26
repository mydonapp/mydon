import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService } from '../../services/accounts.service';
import { ClosableYear, ClosingPreview, ClosingsService } from '../../services/closings.service';
import { CurrencyService } from '../../services/currency.service';
import { FiscalYearsService } from '../../services/fiscal-years.service';
import { LedgerService } from '../../services/ledger.service';
import { PrivacyService } from '../../services/privacy.service';
import { ReportsService } from '../../services/reports.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { ModalComponent } from '../../shared/components/modal/modal';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { BtnDirective } from '../../shared/directives/btn.directive';

/**
 * Year-end closing hub: lists completed fiscal years with their status and the action each needs.
 * "Close" opens a preview modal (simple close posts directly; advanced creates a draft to seal);
 * in-progress years expose Seal / Cancel inline.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fiscal-year-closing',
  templateUrl: './fiscal-year-closing.html',
  imports: [TranslateModule, BtnDirective, IconComponent, ModalComponent, SkeletonComponent],
})
export class FiscalYearClosingComponent implements OnInit {
  private readonly closingsService = inject(ClosingsService);
  private readonly fiscalYearsService = inject(FiscalYearsService);
  private readonly accountsService = inject(AccountsService);
  private readonly reportsService = inject(ReportsService);
  protected readonly ledgerService = inject(LedgerService);
  protected readonly currencyService = inject(CurrencyService);
  protected readonly privacyService = inject(PrivacyService);
  private readonly toastService = inject(ToastService);

  loading = signal(true);
  candidates = signal<ClosableYear[]>([]);
  modalOpen = signal(false);
  previewLoading = signal(false);
  submitting = signal(false);
  selectedYear = signal<number | null>(null);
  preview = signal<ClosingPreview | null>(null);

  closingMode = computed(() => this.ledgerService.ledger()?.closingMode ?? 'SIMPLE');
  selectedCandidate = computed<ClosableYear | null>(
    () => this.candidates().find((c) => c.fiscalYearStartYear === this.selectedYear()) ?? null,
  );

  ngOnInit() {
    this.ledgerService.fetch();
    this.refresh();
  }

  async openClose(year: number) {
    this.selectedYear.set(year);
    this.modalOpen.set(true);
    this.previewLoading.set(true);
    this.preview.set(null);
    try {
      this.preview.set(await this.closingsService.preview(year));
    } catch {
      this.toastService.error('views.manage.closing.previewError');
      this.modalOpen.set(false);
    } finally {
      this.previewLoading.set(false);
    }
  }

  async confirmClose() {
    const year = this.selectedYear();
    if (year === null) {
      return;
    }
    this.submitting.set(true);
    try {
      if (this.closingMode() === 'ADVANCED') {
        await this.fiscalYearsService.initiateClose(year);
        this.toastService.success('views.manage.closing.draftCreated');
      } else {
        await this.closingsService.closeFiscalYear(year);
        this.toastService.success('views.manage.closing.success');
      }
      this.modalOpen.set(false);
      await this.afterChange();
    } catch {
      this.toastService.error('views.manage.closing.error');
    } finally {
      this.submitting.set(false);
    }
  }

  async seal(candidate: ClosableYear) {
    if (!candidate.fiscalYearId) {
      return;
    }
    this.submitting.set(true);
    try {
      await this.fiscalYearsService.seal(candidate.fiscalYearId);
      this.toastService.success('views.manage.closing.sealSuccess');
      await this.afterChange();
    } catch {
      this.toastService.error('views.manage.closing.sealError');
    } finally {
      this.submitting.set(false);
    }
  }

  async cancel(candidate: ClosableYear) {
    if (!candidate.fiscalYearId) {
      return;
    }
    this.submitting.set(true);
    try {
      await this.fiscalYearsService.cancel(candidate.fiscalYearId);
      this.toastService.success('views.manage.closing.cancelSuccess');
      await this.afterChange();
    } catch {
      this.toastService.error('views.manage.closing.cancelError');
    } finally {
      this.submitting.set(false);
    }
  }

  format(amount: number, currency: string): string {
    return this.privacyService.isPrivate() ? '···' : this.currencyService.format(amount, currency);
  }

  private async refresh() {
    this.loading.set(true);
    try {
      this.candidates.set(await this.closingsService.candidates());
    } catch {
      this.toastService.error('views.manage.closing.loadError');
    } finally {
      this.loading.set(false);
    }
  }

  /** Closing mutates balances + period state — refresh report/account caches and the year list. */
  private async afterChange() {
    this.accountsService.invalidate();
    this.reportsService.invalidate();
    await this.refresh();
  }
}
