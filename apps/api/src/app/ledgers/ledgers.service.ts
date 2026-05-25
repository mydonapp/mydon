import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/accounts.entity';
import { User } from '../auth/user.entity';
import { OrganizationMembership } from '../organizations/organization-membership.entity';
import { OrganizationKind } from '../organizations/organization.entity';
import { Currency } from '../shared/currency';
import { ClosingMode, Ledger } from './ledger.entity';

@Injectable()
export class LedgersService {
  constructor(
    @InjectRepository(Ledger)
    private ledgersRepository: Repository<Ledger>,
    @InjectRepository(OrganizationMembership)
    private membershipsRepository: Repository<OrganizationMembership>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createDefaultLedger(
    organizationId: string,
    options: { baseCurrency?: Currency; kind?: OrganizationKind } = {},
  ): Promise<Ledger> {
    const ledger = this.ledgersRepository.create({
      organizationId,
      name: 'Main',
      baseCurrency: options.baseCurrency ?? Currency.CHF,
      closingMode: options.kind === OrganizationKind.BUSINESS ? ClosingMode.ADVANCED : ClosingMode.SIMPLE,
    });
    return this.ledgersRepository.save(ledger);
  }

  /**
   * The user's active ledger ("current books"). Honors `User.activeLedgerId` when it points at a ledger
   * the user can access (their org), otherwise falls back to the earliest ledger of their earliest org
   * membership and self-heals the pointer. No longer assumes a PERSONAL org — a business-only user has none.
   */
  async getDefaultLedgerForUser(userId: string): Promise<Ledger> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (user?.activeLedgerId) {
      const active = await this.ledgersRepository.findOneBy({ id: user.activeLedgerId });
      if (active && (await this.isMember(userId, active.organizationId))) {
        return active;
      }
    }

    const membership = await this.membershipsRepository.findOne({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    if (!membership) {
      throw new NotFoundException(`No organization for user ${userId}`);
    }
    const ledger = await this.ledgersRepository.findOne({
      where: { organizationId: membership.organizationId },
      order: { createdAt: 'ASC' },
    });
    if (!ledger) {
      throw new NotFoundException(`No ledger for organization ${membership.organizationId}`);
    }
    await this.usersRepository.update({ id: userId }, { activeLedgerId: ledger.id });
    return ledger;
  }

  private async isMember(userId: string, organizationId: string): Promise<boolean> {
    return (await this.membershipsRepository.countBy({ userId, organizationId })) > 0;
  }

  /** True if the user belongs to the org that owns the ledger — gate for setting the active ledger. */
  async userCanUseLedger(userId: string, ledgerId: string): Promise<boolean> {
    const ledger = await this.ledgersRepository.findOneBy({ id: ledgerId });
    return ledger ? this.isMember(userId, ledger.organizationId) : false;
  }

  async updateLedger(
    userId: string,
    options: {
      name?: string;
      fiscalYearStartMonth?: number;
      closingMode?: ClosingMode;
      retainedEarningsAccountId?: string | null;
    },
  ): Promise<Ledger> {
    const ledger = await this.getDefaultLedgerForUser(userId);
    if (options.name !== undefined) {
      ledger.name = options.name;
    }
    if (options.fiscalYearStartMonth !== undefined) {
      if (options.fiscalYearStartMonth < 1 || options.fiscalYearStartMonth > 12) {
        throw new BadRequestException('fiscalYearStartMonth must be between 1 and 12');
      }
      ledger.fiscalYearStartMonth = options.fiscalYearStartMonth;
    }
    if (options.closingMode !== undefined) {
      ledger.closingMode = options.closingMode;
    }
    if (options.retainedEarningsAccountId !== undefined) {
      if (options.retainedEarningsAccountId !== null) {
        const account = await this.accountsRepository.findOneBy({
          id: options.retainedEarningsAccountId,
          ledgerId: ledger.id,
        });
        if (!account) {
          throw new BadRequestException('Account not found in this ledger');
        }
        if (account.type !== AccountType.EQUITY) {
          throw new BadRequestException('Retained Earnings account must be of type EQUITY');
        }
      }
      ledger.retainedEarningsAccountId = options.retainedEarningsAccountId;
    }
    return this.ledgersRepository.save(ledger);
  }

  async setRetainedEarningsAccount(ledgerId: string, accountId: string | null): Promise<void> {
    await this.ledgersRepository.update({ id: ledgerId }, { retainedEarningsAccountId: accountId });
  }

  /** Returns the [start, end) date range for the fiscal year that contains `asOf`. */
  fiscalYearBounds(ledger: Pick<Ledger, 'fiscalYearStartMonth'>, asOf: Date): { start: Date; end: Date } {
    const month = ledger.fiscalYearStartMonth;
    const year = asOf.getUTCFullYear();
    const monthIndex = asOf.getUTCMonth() + 1;
    const startYear = monthIndex >= month ? year : year - 1;
    const start = new Date(Date.UTC(startYear, month - 1, 1));
    const end = new Date(Date.UTC(startYear + 1, month - 1, 1));
    return { start, end };
  }

  /** Inclusive end-of-fiscal-year date — convenient for queries that use `<= to`. */
  fiscalYearEndInclusive(ledger: Pick<Ledger, 'fiscalYearStartMonth'>, asOf: Date): Date {
    const { end } = this.fiscalYearBounds(ledger, asOf);
    return new Date(end.getTime() - 1);
  }
}
