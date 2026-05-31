import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountsService, EntryDirection, EntryInput, Issuer, TransactionRecord } from '../../services/accounts.service';
import { ForexService } from '../../services/forex.service';
import { LedgerService } from '../../services/ledger.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ComboboxComponent, ComboboxOption } from '../../shared/components/combobox/combobox';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload';
import { ModalComponent } from '../../shared/components/modal/modal';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { FieldComponent } from '../../shared/components/field/field';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { IconComponent } from '../../shared/components/icon/icon';

interface SplitLine {
  accountId: string;
  direction: EntryDirection;
  amount: number;
  fxRate: number;
}

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
    ModalComponent,
    BtnDirective,
    InputDirective,
    FieldComponent,
    SkeletonComponent,
    IconComponent,
  ],
})
export class ImportComponent implements OnInit {
  accountsService = inject(AccountsService);
  private toastService = inject(ToastService);
  private forexService = inject(ForexService);
  private ledgerService = inject(LedgerService);

  uploading = signal(false);
  draftsLoading = signal(false);
  approving = signal(false);
  selectedAccountId = signal('');
  selectedIssuerId = signal('');
  file = signal<File | null>(null);
  draftTransactions = signal<TransactionRecord[]>([]);
  selectedDrafts = signal<string[]>([]);
  issuers = signal<Issuer[]>([]);

  splitDraft = signal<TransactionRecord | null>(null);
  splitLines = signal<SplitLine[]>([]);
  splitSaving = signal(false);
  splitRateLoading = signal(false);

  // Totals are in the ledger base currency (amount × fxRate) so cross-currency legs balance correctly.
  splitDebitTotal = computed(() => this.sumBase('DEBIT'));
  splitCreditTotal = computed(() => this.sumBase('CREDIT'));
  splitBalanced = computed(
    () => this.splitDebitTotal() > 0 && Math.abs(this.splitDebitTotal() - this.splitCreditTotal()) < 0.005,
  );

  baseCurrency(): string {
    return this.ledgerService.baseCurrency();
  }

  /** The account's currency for a split line (falls back to the base currency when unset). */
  lineCurrency(line: SplitLine): string {
    return this.accountCurrency(line.accountId) ?? this.baseCurrency();
  }

  lineNeedsRate(line: SplitLine): boolean {
    return !!line.accountId && this.lineCurrency(line) !== this.baseCurrency();
  }

  /** A line's value in the base currency. */
  lineBase(line: SplitLine): number {
    return (line.amount || 0) * (line.fxRate || 1);
  }

  private sumBase(direction: EntryDirection): number {
    return this.splitLines()
      .filter((l) => l.direction === direction)
      .reduce((s, l) => s + this.lineBase(l), 0);
  }

  pendingCount() {
    return this.draftTransactions().length;
  }

  /** A draft with more than the usual two legs is a manual split. */
  isSplit(draft: TransactionRecord): boolean {
    return draft.entries.length > 2;
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

  /** Transaction total in the ledger base currency (what the two sides balance to). */
  draftBaseTotal(draft: TransactionRecord): number {
    const debit = draft.entries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.baseAmount, 0);
    const credit = draft.entries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.baseAmount, 0);
    return Math.max(debit, credit);
  }

  /** True when any leg is in a currency other than the ledger base. */
  draftIsForeign(draft: TransactionRecord): boolean {
    const base = this.baseCurrency();
    return draft.entries.some((e) => e.currency && e.currency !== base);
  }

  /** The headline original (non-base) amount to show alongside the base total. */
  draftForeignAmount(draft: TransactionRecord): { amount: number; currency: string } | null {
    const base = this.baseCurrency();
    const foreign = draft.entries.filter((e) => e.currency && e.currency !== base);
    if (foreign.length === 0) {
      return null;
    }
    const top = foreign.reduce((a, b) => (b.amount > a.amount ? b : a));
    return { amount: top.amount, currency: top.currency };
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

  private accountCurrency(id: string): string | null {
    return this.accountsService.accounts().find((a) => a.id === id)?.currency ?? null;
  }

  /**
   * Replace one side's account on a draft. We send the full entries[] back to the server
   * (PATCH replaces the entire set) and reflect the change locally on the next reload.
   * When the two legs are in different currencies, the counter amount is sized from the FX rates
   * so the transaction balances on the base currency (use the Split editor for finer control).
   */
  async setDraftAccount(draftId: string, direction: 'CREDIT' | 'DEBIT', accountId: string) {
    const draft = this.draftTransactions().find((d) => d.id === draftId);
    if (!draft) {
      return;
    }
    const other: 'CREDIT' | 'DEBIT' = direction === 'CREDIT' ? 'DEBIT' : 'CREDIT';
    const otherEntry = this.entryFor(draft, other);
    const base = this.baseCurrency();
    const thisCurrency = this.accountCurrency(accountId) ?? base;
    const otherCurrency = otherEntry?.accountId ? (this.accountCurrency(otherEntry.accountId) ?? base) : null;

    const otherAmount = otherEntry?.amount ?? this.amountFor(draft, direction);
    let thisAmount = otherAmount;
    let thisFxRate = 1;
    let otherFxRate = otherEntry?.fxRate ?? 1;

    if (otherEntry?.accountId && otherCurrency && (thisCurrency !== base || otherCurrency !== base)) {
      try {
        thisFxRate = thisCurrency === base ? 1 : await this.forexService.getRate(thisCurrency, base, draft.transactionDate);
        otherFxRate =
          otherCurrency === base ? 1 : await this.forexService.getRate(otherCurrency, base, draft.transactionDate);
      } catch {
        this.toastService.error('views.importTransactions.split.rateError');
        return;
      }
      thisAmount = Math.round(((otherAmount * otherFxRate) / thisFxRate) * 100) / 100;
    }

    const entries: EntryInput[] = [
      { accountId, direction, amount: thisAmount, currency: thisCurrency, fxRate: thisFxRate },
      ...(otherEntry?.accountId
        ? [
            {
              accountId: otherEntry.accountId,
              direction: other,
              amount: otherAmount,
              currency: otherCurrency ?? base,
              fxRate: otherFxRate,
            },
          ]
        : []),
    ];
    try {
      await this.accountsService.updateDraftTransaction(draftId, { entries });
      // Refetch (the update busted the cache): a newly-assigned side has no local entry to patch,
      // so an in-place map wouldn't surface it until a reload.
      this.draftTransactions.set(await this.accountsService.fetchDraftTransactions());
    } catch {
      this.toastService.error('views.importTransactions.toasts.updateError');
    }
  }

  openSplit(draft: TransactionRecord) {
    this.splitDraft.set(draft);
    // Seed from the current legs; an unassigned counter shows as an empty account row to fill in.
    this.splitLines.set(
      draft.entries.map((e) => ({
        accountId: e.accountId ?? '',
        direction: e.direction,
        amount: e.amount,
        fxRate: e.fxRate || 1,
      })),
    );
    // Imported legs are stamped fxRate=1 even for foreign accounts, so refresh real rates to base.
    void this.refreshSplitRates();
  }

  closeSplit() {
    this.splitDraft.set(null);
    this.splitLines.set([]);
  }

  addSplitLine(direction: EntryDirection) {
    this.splitLines.update((lines) => [...lines, { accountId: '', direction, amount: 0, fxRate: 1 }]);
  }

  /** Set a line's account and pull its FX rate to the base currency (1 when already in base). */
  async onSplitAccountChange(line: SplitLine, accountId: string) {
    line.accountId = accountId;
    const draft = this.splitDraft();
    const cur = this.lineCurrency(line);
    if (draft && cur !== this.baseCurrency()) {
      this.splitRateLoading.set(true);
      try {
        line.fxRate = await this.forexService.getRate(cur, this.baseCurrency(), draft.transactionDate);
      } catch {
        this.toastService.error('views.importTransactions.split.rateError');
      } finally {
        this.splitRateLoading.set(false);
      }
    } else {
      line.fxRate = 1;
    }
    this.onSplitChange();
  }

  private async refreshSplitRates() {
    const draft = this.splitDraft();
    if (!draft) {
      return;
    }
    const base = this.baseCurrency();
    this.splitRateLoading.set(true);
    try {
      for (const line of this.splitLines()) {
        if (!line.accountId) {
          continue;
        }
        const cur = this.lineCurrency(line);
        line.fxRate = cur === base ? 1 : await this.forexService.getRate(cur, base, draft.transactionDate);
      }
    } catch {
      this.toastService.error('views.importTransactions.split.rateError');
    } finally {
      this.splitRateLoading.set(false);
      this.onSplitChange();
    }
  }

  removeSplitLine(index: number) {
    this.splitLines.update((lines) => lines.filter((_, i) => i !== index));
  }

  /** Re-emit the signal so the balance computeds recompute after an in-place edit. */
  onSplitChange() {
    this.splitLines.update((lines) => [...lines]);
  }

  async saveSplit() {
    const draft = this.splitDraft();
    if (!draft) {
      return;
    }
    const base = this.baseCurrency();
    const lines = this.splitLines().filter((l) => l.accountId && l.amount > 0);
    const debitBase = lines.filter((l) => l.direction === 'DEBIT').reduce((s, l) => s + this.lineBase(l), 0);
    const creditBase = lines.filter((l) => l.direction === 'CREDIT').reduce((s, l) => s + this.lineBase(l), 0);
    if (lines.length < 2 || Math.abs(debitBase - creditBase) >= 0.005) {
      this.toastService.error('views.importTransactions.split.unbalanced');
      return;
    }
    const entries: EntryInput[] = lines.map((l) => {
      const currency = this.lineCurrency(l);
      return { accountId: l.accountId, direction: l.direction, amount: l.amount, currency, fxRate: currency === base ? 1 : l.fxRate };
    });
    this.splitSaving.set(true);
    try {
      await this.accountsService.updateDraftTransaction(draft.id, { entries });
      this.draftTransactions.set(await this.accountsService.fetchDraftTransactions());
      this.closeSplit();
      this.toastService.success('views.importTransactions.split.success');
    } catch {
      this.toastService.error('views.importTransactions.toasts.updateError');
    } finally {
      this.splitSaving.set(false);
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
