import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ForexModule } from '../shared/forex/forex.module';
import { Account } from '../accounts/accounts.entity';
import { TransactionMatcherService } from './transaction-matcher.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './transactions.entity';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Account]), ForexModule, AuthModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionMatcherService],
})
export class TransactionsModule {}
