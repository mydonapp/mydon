import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account } from '../accounts/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/user.entity';
import { BudgetItem } from '../budgets/budget-item.entity';
import { Budget } from '../budgets/budgets.entity';
import { LedgersModule } from '../ledgers/ledgers.module';
import { Entry } from '../transactions/entry.entity';
import { Transaction } from '../transactions/transactions.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Transaction, Entry, Budget, BudgetItem, AccountGroup]),
    AuthModule,
    LedgersModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
