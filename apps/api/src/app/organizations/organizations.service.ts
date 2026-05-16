import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { OrganizationMembership, OrganizationRole } from './organization-membership.entity';
import { Organization, OrganizationKind } from './organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private membershipsRepository: Repository<OrganizationMembership>,
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

  async createPersonalOrganization(user: Pick<User, 'id' | 'name'>): Promise<Organization> {
    const org = this.organizationsRepository.create({
      name: user.name,
      kind: OrganizationKind.PERSONAL,
    });
    const saved = await this.organizationsRepository.save(org);
    await this.membershipsRepository.save({
      organizationId: saved.id,
      userId: user.id,
      role: OrganizationRole.OWNER,
    });
    return saved;
  }
}
