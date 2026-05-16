import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService, Issuer, TransactionRecord } from '../../services/accounts.service';
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
    return this.draftTransactions().some((d) => d.creditAccountAISuggested || d.debitAccountAISuggested);
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
      this.toastService.success('Import successful!');
      this.file.set(null);
      await this.loadDrafts();
    } catch {
      this.toastService.error('Import failed.');
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

  async updateDraft(id: string, field: string, value: string) {
    try {
      await this.accountsService.updateDraftTransaction(id, { [field]: value });
      this.draftTransactions.update((drafts) => drafts.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    } catch {
      this.toastService.error('Failed to update transaction.');
    }
  }

  async deleteDraft(id: string) {
    try {
      await this.accountsService.deleteDraftTransaction(id);
      this.draftTransactions.update((d) => d.filter((t) => t.id !== id));
      this.selectedDrafts.update((ids) => ids.filter((i) => i !== id));
    } catch {
      this.toastService.error('Failed to delete transaction.');
    }
  }

  async approveSelected() {
    if (this.selectedDrafts().length === 0) {
      return;
    }
    this.approving.set(true);
    try {
      await this.accountsService.approveDraftTransactions(this.selectedDrafts());
      this.toastService.success('Transactions approved!');
      this.selectedDrafts.set([]);
      await this.loadDrafts();
    } catch {
      this.toastService.error('Failed to approve transactions.');
    } finally {
      this.approving.set(false);
    }
  }
}
