import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalYear, FiscalYearState } from './fiscal-year.entity';

/**
 * Owns the closed-period posting guard. Depends only on the FiscalYear repository — and
 * crucially NOT on TransactionsService — so TransactionsService can depend on it without
 * forming a cycle (TransactionsService → PeriodLockService, closings services → TransactionsService).
 */
@Injectable()
export class PeriodLockService {
  constructor(
    @InjectRepository(FiscalYear)
    private fiscalYearsRepository: Repository<FiscalYear>,
  ) {}

  /**
   * Refuse new/edited postings inside a CLOSED fiscal year. Called by TransactionsService
   * whenever a transaction is created, patched, or posted. The closing transaction itself
   * is exempted (it IS the close and lives inside the period it closes).
   */
  async assertDateNotInClosedPeriod(
    ledgerId: string,
    transactionDate: string,
    options: { allowClosingTransaction?: { transactionId: string | null } } = {},
  ): Promise<void> {
    const fy = await this.fiscalYearsRepository
      .createQueryBuilder('fy')
      .where('fy.ledger_id = :ledgerId', { ledgerId })
      .andWhere(':date >= fy.start_date AND :date < fy.end_date', { date: transactionDate })
      .getOne();
    if (!fy) {
      return;
    }
    if (fy.state === FiscalYearState.CLOSED) {
      if (options.allowClosingTransaction && options.allowClosingTransaction.transactionId === fy.closingTransactionId) {
        return;
      }
      throw new ForbiddenException(
        `Fiscal year ${fy.startYear} is closed. Posting transactions in this period requires reopening the year first.`,
      );
    }
  }
}
