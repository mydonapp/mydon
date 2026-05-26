import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService, EntryInput, Issuer, TransactionRecord } from '../../services/accounts.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ComboboxComponent, ComboboxOption } from '../../shared/components/combobox/combobox';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { SelectDirective } from '../../shared/directives/select.directive';
import { FieldComponent } from '../../shared/components/field/field';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-import',
  templateUrl: './import.html',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    ComboboxComponent,
    FileUploadComponent,
    BtnDirective,
    SelectDirective,
    FieldComponent,
    SkeletonComponent,
    IconComponent,
  ],
})
export class ImportComponent implements OnInit {
  accountsService = inject(AccountsService);
  private toastService = inject(ToastService);

  uploading = signal(false);
  draftsLoading = signal(false);
  approving = signal(false);
  selectedAccountId = signal('');
  selectedIssuerId = signal('');
  file = signal<File | null>(null);
  draftTransactions = signal<TransactionRecord[]>([]);
  selectedDrafts = signal<string[]>([]);
  issuers = signal<Issuer[]>([]);

  pendingCount() {
    return this.draftTransactions().length;
  }

  allSelected() {
    return this.draftTransactions().length > 0 && this.selectedDrafts().length === this.draftTransactions().length;
  }

  hasAiSuggestions() {
    return this.draftTransactions().some((d) => d.entries.some((e) => e.aiSuggested));
  }

  /** Look up the (single) entry of a given direction on a draft, if any. */
  entryFor(draft: TransactionRecord, direction: 'CREDIT' | 'DEBIT') {
    return draft.entries.find((e) => e.direction === direction);
  }

  accountIdFor(draft: TransactionRecord, direction: 'CREDIT' | 'DEBIT'): string {
    return this.entryFor(draft, direction)?.accountId ?? '';
  }

  amountFor(draft: TransactionRecord, direction: 'CREDIT' | 'DEBIT'): number {
    return this.entryFor(draft, direction)?.amount ?? draft.amount;
  }

  accountOptions() {
    return this.accountsService.accounts().map((a) => ({
      value: a.id,
      label: `${a.name} (${a.currency})`,
    }));
  }

  issuerOptions(): ComboboxOption[] {
    return this.issuers().map((i) => ({ value: i.id, label: i.name }));
  }

  ngOnInit() {
    this.accountsService.fetchSimple();
    this.loadIssuers();
    this.loadDrafts();
  }

  async loadIssuers() {
    try {
      this.issuers.set(await this.accountsService.fetchIssuers());
    } catch {
      this.issuers.set([]);
    }
  }

  async loadDrafts() {
    this.draftsLoading.set(true);
    try {
      this.draftTransactions.set(await this.accountsService.fetchDraftTransactions());
    } finally {
      this.draftsLoading.set(false);
    }
  }

  async submitImport() {
    const f = this.file();
    if (!f || !this.selectedAccountId() || !this.selectedIssuerId()) {
      return;
    }
    this.uploading.set(true);
    try {
      await this.accountsService.importTransactions(this.selectedAccountId(), this.selectedIssuerId(), f);
      this.toastService.success('views.importTransactions.toasts.importSuccess');
      this.file.set(null);
      await this.loadDrafts();
    } catch {
      this.toastService.error('views.importTransactions.toasts.importError');
    } finally {
      this.uploading.set(false);
    }
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedDrafts.set(checked ? this.draftTransactions().map((d) => d.id) : []);
  }

  toggleDraft(id: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedDrafts.update((ids) => (checked ? [...ids, id] : ids.filter((i) => i !== id)));
  }

  /**
   * Replace one side's account on a draft. We send the full entries[] back to the server
   * (PATCH replaces the entire set) and reflect the change locally on the next reload.
   */
  async setDraftAccount(draftId: string, direction: 'CREDIT' | 'DEBIT', accountId: string) {
    const draft = this.draftTransactions().find((d) => d.id === draftId);
    if (!draft) {
      return;
    }
    const other: 'CREDIT' | 'DEBIT' = direction === 'CREDIT' ? 'DEBIT' : 'CREDIT';
    const otherEntry = this.entryFor(draft, other);
    const thisAmount = this.amountFor(draft, direction);
    const otherAmount = otherEntry?.amount ?? thisAmount;
    const entries: EntryInput[] = [
      { accountId, direction, amount: thisAmount },
      ...(otherEntry?.accountId ? [{ accountId: otherEntry.accountId, direction: other, amount: otherAmount }] : []),
    ];
    try {
      await this.accountsService.updateDraftTransaction(draftId, { entries });
      this.draftTransactions.update((drafts) =>
        drafts.map((d) =>
          d.id === draftId
            ? {
                ...d,
                entries: d.entries.map((e) => (e.direction === direction ? { ...e, accountId } : e)),
              }
            : d,
        ),
      );
    } catch {
      this.toastService.error('views.importTransactions.toasts.updateError');
    }
  }

  async deleteDraft(id: string) {
    try {
      await this.accountsService.deleteDraftTransaction(id);
      this.draftTransactions.update((d) => d.filter((t) => t.id !== id));
      this.selectedDrafts.update((ids) => ids.filter((i) => i !== id));
    } catch {
      this.toastService.error('views.importTransactions.toasts.deleteError');
    }
  }

  async approveSelected() {
    if (this.selectedDrafts().length === 0) {
      return;
    }
    this.approving.set(true);
    try {
      await this.accountsService.approveDraftTransactions(this.selectedDrafts());
      this.toastService.success('views.importTransactions.toasts.approveSuccess');
      this.selectedDrafts.set([]);
      await this.loadDrafts();
    } catch {
      this.toastService.error('views.importTransactions.toasts.approveError');
    } finally {
      this.approving.set(false);
    }
  }
}
