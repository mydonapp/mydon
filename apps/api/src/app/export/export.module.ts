import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/user.entity';
import { BudgetItem } from '../budgets/budget-item.entity';
import { Budget } from '../budgets/budgets.entity';
import { Category } from '../categories/categories.entity';
import { Transaction } from '../transactions/transactions.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Transaction, Budget, BudgetItem, Category]), AuthModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
