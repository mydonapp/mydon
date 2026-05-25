import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account } from '../accounts/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { LedgersModule } from '../ledgers/ledgers.module';
import { BudgetItem } from './budget-item.entity';
import { BudgetSubItem } from './budget-sub-item.entity';
import { Budget } from './budgets.entity';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, BudgetItem, BudgetSubItem, Account, AccountGroup]),
    AuthModule,
    LedgersModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
