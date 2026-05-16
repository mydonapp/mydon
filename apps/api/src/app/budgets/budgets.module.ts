import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { Category } from '../categories/categories.entity';
import { BudgetItem } from './budget-item.entity';
import { Budget } from './budgets.entity';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetItem, Account, Category]), AuthModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
