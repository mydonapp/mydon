import { Injectable } from '@nestjs/common';
import { Account, AccountType } from './accounts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>
  ) {}

  async findAll() {
    const result = await this.accountsRepository.find();

    return result.map((account) => {
      const creditBalance = account.creditBalance + account.openingBalance;

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        creditBalance: creditBalance,
        debitBalance: account.debitBalance,
        balance: account.balance,
      };
    });
  }

  async test() {
    const a = await this.accountsRepository.findOne({ where: { id: '' } });
    a.setInactive();
    return a;
  }

  createAccount(options: {
    name: string;
    type: AccountType;
    openingBalance: number;
  }) {
    const account = new Account();
    account.name = options.name;
    account.type = options.type;
    account.openingBalance = options.openingBalance;
    return this.accountsRepository.save(account);
  }
}
