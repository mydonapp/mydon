import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { isAccountActive } from '../accounts/account-active';
import { Account } from '../accounts/accounts.entity';
import { PeriodLockService } from '../closings/period-lock.service';
import { Ledger } from '../ledgers/ledger.entity';
import { LedgersService } from '../ledgers/ledgers.service';
import { Currency } from '../shared/currency';
import { todayDateString } from '../shared/date';
import { CENT, roundBaseAmount } from '../shared/money';
import { Context } from '../shared/types/context';
import { Entry, EntryDirection } from './entry.entity';
import { StatementMapperFactory } from './statementMapper/statment-mapper.factory';
import { TransactionMatcherService } from './transaction-matcher.service';
import { Transaction } from './transactions.entity';

export interface EntryInput {
  accountId: string;
  direction: EntryDirection;
  amount: number;
  currency?: Currency;
  fxRate?: number;
  aiSuggested?: boolean;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private transactionMatcher: TransactionMatcherService,
    private ledgersService: LedgersService,
    private periodLockService: PeriodLockService,
    private dataSource: DataSource,
  ) {}

  async findAll(context: Context, filter?: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const txs = await this.transactionRepository.find({
      where: {
        ledgerId: ledger.id,
        ...(filter === 'draft' ? { postedAt: IsNull() } : {}),
        ...(filter === 'posted' ? { postedAt: Not(IsNull()) } : {}),
      },
      relations: ['entries', 'entries.account'],
      order: { transactionDate: 'DESC', createdAt: 'ASC', id: 'ASC' },
    });
    return txs.map((tx) => this.serialize(tx));
  }

  async createTransaction(
    context: Context,
    options: {
      description: string;
      reference?: string;
      transactionDate: string;
      entries: EntryInput[];
      post?: boolean;
      closing?: boolean;
    },
  ) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    await this.periodLockService.assertDateNotInClosedPeriod(ledger.id, options.transactionDate);
    const resolved = await this.validateEntries(options.entries, options.transactionDate, ledger);

    return this.dataSource.transaction(async (manager) => {
      const tx = manager.create(Transaction, {
        ledgerId: ledger.id,
        description: options.description,
        reference: options.reference ?? null,
        transactionDate: options.transactionDate,
        postedAt: options.post === false ? null : new Date(),
        closing: options.closing ?? false,
      });
      const savedTx = await manager.save(Transaction, tx);
      const entries = resolved.map((e) => this.buildEntry(savedTx.id, e));
      await manager.save(Entry, entries);
      const reloaded = await manager.findOneOrFail(Transaction, {
        where: { id: savedTx.id },
        relations: ['entries', 'entries.account'],
      });
      return this.serialize(reloaded);
    });
  }

  async patchTransaction(
    context: Context,
    id: string,
    options: {
      description?: string;
      reference?: string;
      transactionDate?: string;
      entries?: EntryInput[];
    },
  ) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const tx = await this.transactionRepository.findOne({
      where: { id, ledgerId: ledger.id },
      relations: ['entries'],
    });
    if (!tx) {
      throw new NotFoundException();
    }
    if (tx.postedAt !== null) {
      throw new ConflictException('Posted transactions are immutable. Use reverseTransaction to correct.');
    }

    if (options.description !== undefined) {
      tx.description = options.description;
    }
    if (options.reference !== undefined) {
      tx.reference = options.reference;
    }
    if (options.transactionDate !== undefined) {
      tx.transactionDate = options.transactionDate;
    }
    await this.periodLockService.assertDateNotInClosedPeriod(ledger.id, tx.transactionDate, {
      allowClosingTransaction: { transactionId: tx.id },
    });

    return this.dataSource.transaction(async (manager) => {
      await manager.save(Transaction, tx);
      if (options.entries) {
        const resolved = await this.validateEntries(options.entries, tx.transactionDate, ledger);
        await manager.delete(Entry, { transactionId: tx.id });
        const newEntries = resolved.map((e) => this.buildEntry(tx.id, e));
        await manager.save(Entry, newEntries);
      }
      const reloaded = await manager.findOneOrFail(Transaction, {
        where: { id: tx.id },
        relations: ['entries', 'entries.account'],
      });
      return this.serialize(reloaded);
    });
  }

  async postTransaction(context: Context, id: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const tx = await this.transactionRepository.findOne({
      where: { id, ledgerId: ledger.id },
      relations: ['entries', 'entries.account'],
    });
    if (!tx) {
      throw new NotFoundException();
    }
    if (tx.postedAt !== null) {
      throw new ConflictException('Already posted');
    }
    await this.periodLockService.assertDateNotInClosedPeriod(ledger.id, tx.transactionDate, {
      allowClosingTransaction: { transactionId: tx.id },
    });
    await this.validateEntries(
      tx.entries.map((e) => ({
        accountId: e.accountId,
        direction: e.direction,
        amount: Number(e.amount),
        currency: e.currency,
        fxRate: Number(e.fxRate),
      })),
      tx.transactionDate,
      ledger,
    );
    tx.postedAt = new Date();
    await this.transactionRepository.save(tx);
    return this.serialize(tx);
  }

  async reverseTransaction(context: Context, id: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const original = await this.transactionRepository.findOne({
      where: { id, ledgerId: ledger.id },
      relations: ['entries'],
    });
    if (!original) {
      throw new NotFoundException();
    }
    if (original.postedAt === null) {
      throw new BadRequestException('Cannot reverse a draft. Delete it instead.');
    }

    return this.dataSource.transaction(async (manager) => {
      const reversal = manager.create(Transaction, {
        ledgerId: original.ledgerId,
        description: `Reversal of: ${original.description}`,
        reference: original.reference,
        transactionDate: todayDateString(),
        postedAt: new Date(),
        reversesTransactionId: original.id,
      });
      const savedTx = await manager.save(Transaction, reversal);
      const flipped = original.entries.map((e) =>
        manager.create(Entry, {
          transactionId: savedTx.id,
          accountId: e.accountId,
          direction: e.direction === EntryDirection.DEBIT ? EntryDirection.CREDIT : EntryDirection.DEBIT,
          amount: e.amount,
          currency: e.currency,
          fxRate: e.fxRate,
          baseAmount: e.baseAmount,
        }),
      );
      await manager.save(Entry, flipped);
      const reloaded = await manager.findOneOrFail(Transaction, {
        where: { id: savedTx.id },
        relations: ['entries', 'entries.account'],
      });
      return this.serialize(reloaded);
    });
  }

  async deleteTransaction(context: Context, id: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const tx = await this.transactionRepository.findOne({ where: { id, ledgerId: ledger.id } });
    if (!tx) {
      throw new NotFoundException();
    }
    if (tx.postedAt !== null) {
      throw new ConflictException('Posted transactions are immutable. Use reverseTransaction to correct.');
    }
    return this.transactionRepository.delete({ id, ledgerId: ledger.id });
  }

  async importStatement(context: Context, fileContent: string, statementIssuer: string, accountId: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const importAccount = await this.accountRepository.findOne({ where: { id: accountId, ledgerId: ledger.id } });
    if (!importAccount) {
      throw new NotFoundException('Account not found');
    }
    if (!isAccountActive(importAccount)) {
      throw new BadRequestException('Cannot import into an inactive account');
    }

    const mapper = StatementMapperFactory.create(
      context,
      fileContent,
      statementIssuer,
      accountId,
      this.transactionMatcher,
    );
    const drafts = await mapper.convertStatement();

    return this.dataSource.transaction(async (manager) => {
      const saved: Transaction[] = [];
      for (const d of drafts) {
        const tx = manager.create(Transaction, {
          ledgerId: ledger.id,
          description: d.description ?? '',
          transactionDate: d.transactionDate,
          postedAt: null,
          raw: d.raw ?? null,
        });
        const savedTx = await manager.save(Transaction, tx);
        const creditAccount = d.creditAccountId
          ? await manager.findOne(Account, { where: { id: d.creditAccountId } })
          : null;
        const debitAccount = d.debitAccountId
          ? await manager.findOne(Account, { where: { id: d.debitAccountId } })
          : null;
        const entries: Entry[] = [];
        if (creditAccount) {
          entries.push(
            manager.create(Entry, {
              transactionId: savedTx.id,
              accountId: creditAccount.id,
              direction: EntryDirection.CREDIT,
              amount: d.creditAmount ?? 0,
              currency: creditAccount.currency,
              fxRate: 1,
              baseAmount: roundBaseAmount(d.creditAmount ?? 0),
              aiSuggested: d.creditAccountAISuggested ?? false,
            }),
          );
        }
        if (debitAccount) {
          entries.push(
            manager.create(Entry, {
              transactionId: savedTx.id,
              accountId: debitAccount.id,
              direction: EntryDirection.DEBIT,
              amount: d.debitAmount ?? 0,
              currency: debitAccount.currency,
              fxRate: 1,
              baseAmount: roundBaseAmount(d.debitAmount ?? 0),
              aiSuggested: d.debitAccountAISuggested ?? false,
            }),
          );
        }
        if (entries.length > 0) {
          await manager.save(Entry, entries);
        }
        saved.push(savedTx);
      }
      return saved.map((t) => ({ id: t.id }));
    });
  }

  /**
   * Validate the entry list AND apply the only two deterministic defaults the server is
   * allowed to fill: `currency = account.currency` when omitted, and `fxRate = 1` when the
   * resolved currency equals the ledger base currency. Any other `fxRate` MUST be supplied
   * by the client — the server never silently invents an FX rate, because that would
   * overwrite whatever the user typed.
   *
   * Returns the resolved entries (with `currency`, `fxRate` and the persisted cent-scale `baseAmount`
   * guaranteed set) for the caller to persist.
   */
  private async validateEntries(
    entries: EntryInput[],
    txDate: string,
    ledger: Ledger,
  ): Promise<(EntryInput & { currency: Currency; fxRate: number; baseAmount: number })[]> {
    if (entries.length < 2) {
      throw new BadRequestException('A transaction must have at least two entries (one debit, one credit)');
    }
    const accountIds = [...new Set(entries.map((e) => e.accountId))];
    const accounts = await this.accountRepository.find({ where: { id: In(accountIds), ledgerId: ledger.id } });
    if (accounts.length !== accountIds.length) {
      throw new BadRequestException('One or more accounts are not in the current ledger');
    }
    const accountById = new Map(accounts.map((a) => [a.id, a]));

    const resolved: (EntryInput & { currency: Currency; fxRate: number; baseAmount: number })[] = [];
    let debitTotal = 0;
    let creditTotal = 0;
    let fxLegCount = 0;

    for (const e of entries) {
      const account = accountById.get(e.accountId);
      if (!account) {
        throw new BadRequestException(`Account ${e.accountId} is not in the current ledger`);
      }
      if (!isAccountActive(account, txDate)) {
        throw new BadRequestException(`Account ${account.name} is not active on the transaction date`);
      }
      if (e.amount < 0) {
        throw new BadRequestException('Entry amount must be non-negative; use direction to indicate sign');
      }

      const currency = e.currency ?? account.currency;
      let fxRate: number;
      if (currency === ledger.baseCurrency) {
        fxRate = e.fxRate ?? 1;
      } else if (e.fxRate == null) {
        throw new BadRequestException(
          `Entry in ${currency} requires an explicit fxRate to ${ledger.baseCurrency}; ` +
            `look one up via GET /v1/forex/rate?from=${currency}&to=${ledger.baseCurrency}&date=${txDate}`,
        );
      } else {
        fxRate = e.fxRate;
      }

      // Balance on the cent-rounded base amount (what actually persists), not the raw product.
      const baseAmount = roundBaseAmount(e.amount * fxRate);
      if (fxRate !== 1) {
        fxLegCount += 1;
      }
      if (e.direction === EntryDirection.DEBIT) {
        debitTotal += baseAmount;
      } else {
        creditTotal += baseAmount;
      }
      resolved.push({ ...e, currency, fxRate, baseAmount });
    }

    // Each FX leg's base is independently rounded to the cent, and the client sizes the balancing leg
    // with its own rounding — so a sound cross-currency transaction can still differ by up to a cent per
    // FX leg (e.g. 14500 KRW × 0.00053 → 7.68 vs a 7.69 counter-leg). Same-currency entries have no such
    // slack and must balance exactly. Anything beyond the rounding band is a real imbalance → reject.
    const residual = roundBaseAmount(debitTotal - creditTotal);
    const tolerance = fxLegCount > 0 ? CENT * fxLegCount : 0.005;
    if (Math.abs(residual) > tolerance + 1e-9) {
      throw new BadRequestException(
        `Entries are not balanced: debit total ${debitTotal} vs credit total ${creditTotal}`,
      );
    }

    // Absorb the rounding residual on the largest leg of the heavier side so the *persisted* entries
    // balance to the cent — otherwise the residual would accumulate and drift the trial balance.
    if (residual !== 0) {
      const heavierSide = residual > 0 ? EntryDirection.DEBIT : EntryDirection.CREDIT;
      const target = resolved
        .filter((r) => r.direction === heavierSide)
        .reduce((max, r) => (r.baseAmount > max.baseAmount ? r : max));
      target.baseAmount = roundBaseAmount(target.baseAmount - Math.abs(residual));
    }

    return resolved;
  }

  private buildEntry(transactionId: string, input: EntryInput & { baseAmount?: number }): Entry {
    const e = new Entry();
    e.transactionId = transactionId;
    e.accountId = input.accountId;
    e.direction = input.direction;
    e.amount = input.amount;
    e.currency = input.currency ?? Currency.CHF;
    e.fxRate = input.fxRate ?? 1;
    // Prefer the balanced base amount resolved by validateEntries (rounding residual already absorbed);
    // fall back to a fresh cent-rounded product for any direct caller.
    e.baseAmount = input.baseAmount ?? roundBaseAmount(input.amount * (input.fxRate ?? 1));
    e.aiSuggested = input.aiSuggested ?? false;
    return e;
  }

  /**
   * Build the response shape for a single transaction.
   * `amount` is the absolute value of the transaction (= sum of debit base amounts =
   * sum of credit base amounts when balanced) — useful for list-views.
   */
  private serialize(tx: Transaction) {
    const entries = tx.entries.map((e) => ({
      id: e.id,
      accountId: e.accountId,
      accountName: e.account?.name,
      accountType: e.account?.type,
      direction: e.direction,
      amount: Number(e.amount),
      currency: e.currency,
      fxRate: Number(e.fxRate),
      baseAmount: Number(e.baseAmount),
      aiSuggested: e.aiSuggested,
    }));
    // A balanced (posted) transaction has equal debit/credit totals; an import draft may carry only
    // one side, so take the larger — single-entry drafts still show their real amount instead of 0.
    const debitTotal = entries
      .filter((e) => e.direction === EntryDirection.DEBIT)
      .reduce((sum, e) => sum + e.baseAmount, 0);
    const creditTotal = entries
      .filter((e) => e.direction === EntryDirection.CREDIT)
      .reduce((sum, e) => sum + e.baseAmount, 0);
    const amount = Math.max(debitTotal, creditTotal);
    return {
      id: tx.id,
      ledgerId: tx.ledgerId,
      description: tx.description,
      reference: tx.reference,
      transactionDate: tx.transactionDate,
      postedAt: tx.postedAt,
      reversesTransactionId: tx.reversesTransactionId,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      entries,
      amount,
      draft: tx.postedAt === null,
    };
  }
}
