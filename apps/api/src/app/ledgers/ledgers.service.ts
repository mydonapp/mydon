import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMembership } from '../organizations/organization-membership.entity';
import { OrganizationKind } from '../organizations/organization.entity';
import { Ledger } from './ledger.entity';

@Injectable()
export class LedgersService {
  constructor(
    @InjectRepository(Ledger)
    private ledgersRepository: Repository<Ledger>,
    @InjectRepository(OrganizationMembership)
    private membershipsRepository: Repository<OrganizationMembership>,
  ) {}

  async createDefaultLedger(organizationId: string, baseCurrency = 'CHF'): Promise<Ledger> {
    const ledger = this.ledgersRepository.create({
      organizationId,
      name: 'Main',
      baseCurrency,
    });
    return this.ledgersRepository.save(ledger);
  }

  async getDefaultLedgerForUser(userId: string): Promise<Ledger> {
    const membership = await this.membershipsRepository.findOne({
      where: { userId, organization: { kind: OrganizationKind.PERSONAL } },
      relations: ['organization'],
    });
    if (!membership) {
      throw new NotFoundException(`No personal organization for user ${userId}`);
    }
    const ledger = await this.ledgersRepository.findOne({
      where: { organizationId: membership.organizationId },
      order: { createdAt: 'ASC' },
    });
    if (!ledger) {
      throw new NotFoundException(`No ledger for organization ${membership.organizationId}`);
    }
    return ledger;
  }
}
