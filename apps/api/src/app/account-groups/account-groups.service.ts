import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgersService } from '../ledgers/ledgers.service';
import { Context } from '../shared/types/context';
import { AccountGroup } from './account-group.entity';

@Injectable()
export class AccountGroupsService {
  constructor(
    @InjectRepository(AccountGroup)
    private accountGroupsRepository: Repository<AccountGroup>,
    private ledgersService: LedgersService,
  ) {}

  async findAll(context: Context): Promise<AccountGroup[]> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    return this.accountGroupsRepository.find({
      where: { ledgerId: ledger.id },
      order: { code: 'ASC', name: 'ASC' },
    });
  }

  /** Reject a parent reference that belongs to another ledger (cross-tenant FK). */
  private async assertParentInLedger(parentId: string, ledgerId: string): Promise<void> {
    const exists = await this.accountGroupsRepository.count({ where: { id: parentId, ledgerId } });
    if (exists === 0) {
      throw new NotFoundException('Parent account group not found in this ledger');
    }
  }

  async create(
    context: Context,
    data: { name: string; code?: string; parentId?: string | null },
  ): Promise<AccountGroup> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    if (data.parentId) {
      await this.assertParentInLedger(data.parentId, ledger.id);
    }
    const group = this.accountGroupsRepository.create({
      ledgerId: ledger.id,
      name: data.name,
      code: data.code ?? '',
      parentId: data.parentId ?? null,
    });
    return this.accountGroupsRepository.save(group);
  }

  async update(
    context: Context,
    id: string,
    data: { name?: string; code?: string; parentId?: string | null },
  ): Promise<AccountGroup> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const group = await this.accountGroupsRepository.findOne({
      where: { id, ledgerId: ledger.id },
    });
    if (!group) {
      throw new NotFoundException();
    }
    if (data.name !== undefined) {
      group.name = data.name;
    }
    if (data.code !== undefined) {
      group.code = data.code;
    }
    if (data.parentId !== undefined) {
      if (data.parentId) {
        if (data.parentId === id) {
          throw new BadRequestException('A group cannot be its own parent');
        }
        await this.assertParentInLedger(data.parentId, ledger.id);
      }
      group.parentId = data.parentId;
    }
    return this.accountGroupsRepository.save(group);
  }
}
