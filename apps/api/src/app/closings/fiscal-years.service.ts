import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isAccountActive } from '../accounts/account-active';
import { Account } from '../accounts/accounts.entity';
import { LedgersService } from '../ledgers/ledgers.service';
import { fiscalYearPeriod } from '../shared/date';
import { Context } from '../shared/types/context';
import { Transaction } from '../transactions/transactions.entity';
import { EntryInput, TransactionsService } from '../transactions/transactions.service';
import { ClosingsService } from './closings.service';
import { FiscalYear, FiscalYearState } from './fiscal-year.entity';

@Injectable()
export class FiscalYearsService {
  constructor(
    @InjectRepository(FiscalYear)
    private fiscalYearsRepository: Repository<FiscalYear>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private ledgersService: LedgersService,
    private closingsService: ClosingsService,
    private transactionsService: TransactionsService,
    private dataSource: DataSource,
  ) {}

  async listForCurrentLedger(context: Context) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const years = await this.fiscalYearsRepository.find({
      where: { ledgerId: ledger.id },
      order: { startYear: 'DESC' },
    });
    return years.map((y) => this.serialize(y));
  }

  /** Move OPEN → CLOSING by generating a draft closing transaction for review. */
  async initiateClose(context: Context, fiscalYearStartYear: number) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const existing = await this.fiscalYearsRepository.findOneBy({ ledgerId: ledger.id, startYear: fiscalYearStartYear });
    if (existing && existing.state !== FiscalYearState.OPEN) {
      throw new ConflictException(`Fiscal year ${fiscalYearStartYear} is already ${existing.state.toLowerCase()}.`);
    }

    const preview = await this.closingsService.preview(context, fiscalYearStartYear);
    if (preview.entries.length < 2) {
      throw new BadRequestException('Nothing to close — no income or expense activity in this fiscal year.');
    }
    const retainedEarnings = await this.accountsRepository.findOneByOrFail({ id: preview.retainedEarningsAccountId });
    if (!isAccountActive(retainedEarnings, preview.periodEnd)) {
      throw new BadRequestException('Retained Earnings account is not active on the closing date.');
    }

    const entries: EntryInput[] = preview.entries.map((e) => ({
      accountId: e.accountId,
      direction: e.direction,
      amount: e.amount,
      currency: e.currency,
      fxRate: 1,
    }));

    const period = fiscalYearPeriod(fiscalYearStartYear, ledger.fiscalYearStartMonth);
    return this.dataSource.transaction(async (manager) => {
      // Persist the FiscalYear row first so the CLOSED-period guard sees it during the draft create.
      const fy =
        existing ??
        manager.create(FiscalYear, {
          ledgerId: ledger.id,
          startYear: fiscalYearStartYear,
          startDate: period.start,
          endDate: period.endExclusive,
        });
      fy.state = FiscalYearState.CLOSING;
      const savedFy = await manager.save(FiscalYear, fy);

      const draftTx = await this.transactionsService.createTransaction(context, {
        description: preview.description,
        transactionDate: preview.periodEnd,
        entries,
        post: false,
        closing: true,
      });
      savedFy.closingTransactionId = draftTx.id;
      await manager.save(FiscalYear, savedFy);

      return { fiscalYear: this.serialize(savedFy), draftTransaction: draftTx };
    });
  }

  /** CLOSING → CLOSED: post the (potentially user-edited) draft and seal the period. */
  async seal(context: Context, fiscalYearId: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const fy = await this.fiscalYearsRepository.findOneBy({ id: fiscalYearId, ledgerId: ledger.id });
    if (!fy) {
      throw new NotFoundException();
    }
    if (fy.state !== FiscalYearState.CLOSING) {
      throw new BadRequestException(`Can only seal a fiscal year in CLOSING state (was ${fy.state}).`);
    }
    if (!fy.closingTransactionId) {
      throw new BadRequestException('No draft closing transaction is attached to this fiscal year.');
    }

    const closingTransactionId = fy.closingTransactionId;
    return this.dataSource.transaction(async (manager) => {
      // Post the draft first; if validation fails the FiscalYear stays in CLOSING.
      await this.transactionsService.postTransaction(context, closingTransactionId);
      fy.state = FiscalYearState.CLOSED;
      fy.closedAt = new Date();
      await manager.save(FiscalYear, fy);
      return this.serialize(fy);
    });
  }

  /** CLOSING → OPEN: drop the draft and reopen the period. */
  async cancelClose(context: Context, fiscalYearId: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const fy = await this.fiscalYearsRepository.findOneBy({ id: fiscalYearId, ledgerId: ledger.id });
    if (!fy) {
      throw new NotFoundException();
    }
    if (fy.state !== FiscalYearState.CLOSING) {
      throw new BadRequestException(`Can only cancel a fiscal year in CLOSING state (was ${fy.state}).`);
    }
    return this.dataSource.transaction(async (manager) => {
      if (fy.closingTransactionId) {
        // Delete the draft only — a draft is safe to drop; if it had been posted, state would be CLOSED.
        await manager.delete(Transaction, { id: fy.closingTransactionId, ledgerId: ledger.id, postedAt: null });
      }
      fy.state = FiscalYearState.OPEN;
      fy.closingTransactionId = null;
      await manager.save(FiscalYear, fy);
      return this.serialize(fy);
    });
  }

  private serialize(fy: FiscalYear) {
    return {
      id: fy.id,
      startYear: fy.startYear,
      startDate: fy.startDate,
      endDate: fy.endDate,
      state: fy.state,
      closingTransactionId: fy.closingTransactionId,
      closedAt: fy.closedAt,
    };
  }
}
