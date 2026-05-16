import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account } from '../accounts/accounts.entity';
import { User } from '../auth/user.entity';
import { BudgetItem } from '../budgets/budget-item.entity';
import { Budget } from '../budgets/budgets.entity';
import { LedgersService } from '../ledgers/ledgers.service';
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
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemRepository: Repository<BudgetItem>,
    @InjectRepository(AccountGroup)
    private accountGroupRepository: Repository<AccountGroup>,
    private ledgersService: LedgersService,
  ) {}

  async exportUserData(context: Context): Promise<{
    userCsv: string;
    accountsCsv: string;
    transactionsCsv: string;
    budgetsCsv: string;
    budgetItemsCsv: string;
    accountGroupsCsv: string;
    filename: string;
  }> {
    const userId = context.user.id;
    const ledger = await this.ledgersService.getDefaultLedgerForUser(userId);

    const [user, accounts, transactions, budgets, accountGroups] = await Promise.all([
      this.userRepository.findOneOrFail({ where: { id: userId } }),
      this.accountRepository.find({ where: { user: { id: userId } }, relations: ['user'] }),
      this.transactionRepository.find({
        where: { user: { id: userId } },
        relations: ['creditAccount', 'debitAccount', 'user'],
      }),
      this.budgetRepository.find({
        where: { user: { id: userId } },
        relations: ['items', 'items.account', 'items.group'],
      }),
      this.accountGroupRepository.find({ where: { ledgerId: ledger.id } }),
    ]);

    const budgetItems = budgets.flatMap((b) =>
      b.items.map((item) => ({ ...item, budgetId: b.id, budgetName: b.name })),
    );

    return {
      userCsv: this.generateUserCsv(user),
      accountsCsv: this.generateAccountsCsv(accounts),
      transactionsCsv: this.generateTransactionsCsv(transactions),
      budgetsCsv: this.generateBudgetsCsv(budgets),
      budgetItemsCsv: this.generateBudgetItemsCsv(budgetItems),
      accountGroupsCsv: this.generateAccountGroupsCsv(accountGroups),
      filename: `${new Date().toISOString().split('T')[0]}-mydon-export`,
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
    const rows = transactions.map((t) => [
      t.id,
      t.transactionDate?.toISOString() || '',
      this.escapeCsvValue(t.description),
      t.creditAmount,
      t.debitAmount,
      t.creditAccount?.id || '',
      this.escapeCsvValue(t.creditAccount?.name || ''),
      t.debitAccount?.id || '',
      this.escapeCsvValue(t.debitAccount?.name || ''),
      t.draft,
      t.creditAccountAISuggested,
      t.debitAccountAISuggested,
      t.matchedTransactionId || '',
      t.createdAt?.toISOString() || '',
      t.updatedAt?.toISOString() || '',
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private generateBudgetsCsv(budgets: Budget[]): string {
    const headers = ['ID', 'Name', 'Year'];
    const rows = budgets.map((b) => [b.id, this.escapeCsvValue(b.name), b.year]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private generateBudgetItemsCsv(items: (BudgetItem & { budgetId: string; budgetName: string })[]): string {
    const headers = [
      'ID',
      'Budget ID',
      'Budget Name',
      'Account ID',
      'Account Name',
      'Account Group ID',
      'Account Group Name',
      'Amount',
      'Frequency',
    ];
    const rows = items.map((item) => [
      item.id,
      item.budgetId,
      this.escapeCsvValue(item.budgetName),
      item.account?.id || '',
      this.escapeCsvValue(item.account?.name || ''),
      item.group?.id || '',
      this.escapeCsvValue(item.group?.name || ''),
      item.amount,
      item.frequency,
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private generateAccountGroupsCsv(groups: AccountGroup[]): string {
    const headers = ['ID', 'Name', 'Code'];
    const rows = groups.map((g) => [g.id, this.escapeCsvValue(g.name), g.code]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private escapeCsvValue(value: string): string {
    if (!value) {
      return '';
    }
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
