import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { Ledger } from '../ledgers/ledger.entity';
import { OrganizationMembership, OrganizationRole } from './organization-membership.entity';
import { Organization, OrganizationKind } from './organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private membershipsRepository: Repository<OrganizationMembership>,
    @InjectRepository(Ledger)
    private ledgersRepository: Repository<Ledger>,
  ) {}

  async getPersonalOrganizationForUser(userId: string): Promise<Organization> {
    const membership = await this.membershipsRepository.findOne({
      where: { userId, organization: { kind: OrganizationKind.PERSONAL } },
      relations: ['organization'],
    });
    if (!membership) {
      throw new NotFoundException(`No personal organization for user ${userId}`);
    }
    return membership.organization;
  }

  /** Create an organization of the given kind and make the user its OWNER. */
  async createOrganization(user: Pick<User, 'id'>, kind: OrganizationKind, name: string): Promise<Organization> {
    const org = this.organizationsRepository.create({ name, kind });
    const saved = await this.organizationsRepository.save(org);
    await this.membershipsRepository.save({
      organizationId: saved.id,
      userId: user.id,
      role: OrganizationRole.OWNER,
    });
    return saved;
  }

  /** Every org the user belongs to, each with its ledgers — feeds the org/ledger switchers. */
  async listForUser(userId: string) {
    const memberships = await this.membershipsRepository.find({
      where: { userId },
      relations: ['organization'],
      order: { createdAt: 'ASC' },
    });
    const orgIds = memberships.map((m) => m.organizationId);
    const ledgers = orgIds.length
      ? await this.ledgersRepository.find({ where: { organizationId: In(orgIds) }, order: { createdAt: 'ASC' } })
      : [];
    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      kind: m.organization.kind,
      role: m.role,
      ledgers: ledgers
        .filter((l) => l.organizationId === m.organizationId)
        .map((l) => ({ id: l.id, name: l.name, baseCurrency: l.baseCurrency })),
    }));
  }
}
