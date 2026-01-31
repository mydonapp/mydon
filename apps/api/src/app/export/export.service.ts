import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/accounts.entity';
import { User } from '../auth/user.entity';
import { Context } from '../shared/types/context';
import { Transaction } from '../transactions/transactions.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async exportUserData(context: Context): Promise<{
    userCsv: string;
    accountsCsv: string;
    transactionsCsv: string;
    filename: string;
  }> {
    const userId = context.user.id;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    const accounts = await this.accountRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    const transactions = await this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: ['creditAccount', 'debitAccount', 'user'],
    });

    const userCsv = this.generateUserCsv(user);
    const accountsCsv = this.generateAccountsCsv(accounts);
    const transactionsCsv = this.generateTransactionsCsv(transactions);

    const filename = `${new Date().toISOString().split('T')[0]}-mydon-export`;

    return {
      userCsv,
      accountsCsv,
      transactionsCsv,
      filename,
    };
  }

  private generateUserCsv(user: User): string {
    const headers = ['ID', 'Name', 'Email'];
    const values = [user.id, this.escapeCsvValue(user.name), user.email];

    return `${headers.join(',')}\n${values.join(',')}`;
  }

  private generateAccountsCsv(accounts: Account[]): string {
    const headers = ['ID', 'Name', 'Type', 'Currency', 'Balance', 'Opening Balance', 'Retirement Account'];

    const rows = accounts.map((account) => [
      account.id,
      this.escapeCsvValue(account.name),
      account.type,
      account.currency,
      account.balance,
      account.openingBalance,
      account.retirementAccount,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private generateTransactionsCsv(transactions: Transaction[]): string {
    const headers = [
      'ID',
      'Date',
      'Description',
      'Credit Amount',
      'Debit Amount',
      'Credit Account ID',
      'Credit Account Name',
      'Debit Account ID',
      'Debit Account Name',
      'Draft',
      'Credit Account AI Suggested',
      'Debit Account AI Suggested',
      'Matched Transaction ID',
      'Created At',
      'Updated At',
    ];

    const rows = transactions.map((transaction) => [
      transaction.id,
      transaction.transactionDate?.toISOString() || '',
      this.escapeCsvValue(transaction.description),
      transaction.creditAmount,
      transaction.debitAmount,
      transaction.creditAccount?.id || '',
      this.escapeCsvValue(transaction.creditAccount?.name || ''),
      transaction.debitAccount?.id || '',
      this.escapeCsvValue(transaction.debitAccount?.name || ''),
      transaction.draft,
      transaction.creditAccountAISuggested,
      transaction.debitAccountAISuggested,
      transaction.matchedTransactionId || '',
      transaction.createdAt?.toISOString() || '',
      transaction.updatedAt?.toISOString() || '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';

    // If the value contains comma, quote, or newline, wrap it in quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escape quotes by doubling them
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }
}
