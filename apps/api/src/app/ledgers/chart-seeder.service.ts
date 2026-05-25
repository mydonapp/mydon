import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account } from '../accounts/accounts.entity';
import { OrganizationKind } from '../organizations/organization.entity';
import { BUSINESS_CHART } from './charts/business-chart';
import { ChartDefinition, localize } from './charts/chart.types';
import { PERSONAL_CHART } from './charts/personal-chart';
import { Ledger } from './ledger.entity';

@Injectable()
export class ChartSeederService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(AccountGroup)
    private accountGroupsRepository: Repository<AccountGroup>,
    @InjectRepository(Ledger)
    private ledgersRepository: Repository<Ledger>,
  ) {}

  /**
   * Provision a starter chart of accounts (names in the user's `language`) and link the
   * retained-earnings account on the ledger.
   */
  async seedChart(ledger: Ledger, kind: OrganizationKind, language: string): Promise<void> {
    const chart = this.chartForKind(kind);
    const groupByTag: Record<string, AccountGroup> = {};

    // Two passes: parents first (no parentTag), then children — so parent FKs resolve.
    const orderedGroups = [...chart.groups].sort((a, b) => Number(!!a.parentTag) - Number(!!b.parentTag));
    for (const def of orderedGroups) {
      const group = new AccountGroup();
      group.ledgerId = ledger.id;
      group.name = localize(def.name, language);
      group.code = def.code ?? '';
      if (def.parentTag) {
        const parent = groupByTag[def.parentTag];
        if (!parent) {
          throw new Error(`Chart references unknown parent tag '${def.parentTag}'`);
        }
        group.parentId = parent.id;
      }
      groupByTag[def.tag] = await this.accountGroupsRepository.save(group);
    }

    let retainedEarningsAccountId: string | null = null;
    for (const def of chart.accounts) {
      const account = new Account();
      account.ledgerId = ledger.id;
      account.name = localize(def.name, language);
      account.type = def.type;
      account.code = def.code ?? '';
      if (def.groupTag) {
        const group = groupByTag[def.groupTag];
        if (!group) {
          throw new Error(`Chart references unknown group tag '${def.groupTag}'`);
        }
        account.group = group;
      }
      const saved = await this.accountsRepository.save(account);
      if (def.retainedEarnings) {
        retainedEarningsAccountId = saved.id;
      }
    }

    if (retainedEarningsAccountId) {
      await this.ledgersRepository.update({ id: ledger.id }, { retainedEarningsAccountId });
    }
  }

  private chartForKind(kind: OrganizationKind): ChartDefinition {
    return kind === OrganizationKind.BUSINESS ? BUSINESS_CHART : PERSONAL_CHART;
  }
}
