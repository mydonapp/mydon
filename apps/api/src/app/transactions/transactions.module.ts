import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { LedgersModule } from '../ledgers/ledgers.module';
import { ForexModule } from '../shared/forex/forex.module';
import { Entry } from './entry.entity';
import { TransactionMatcherService } from './transaction-matcher.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './transactions.entity';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Entry, Account]), ForexModule, AuthModule, LedgersModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionMatcherService],
})
export class TransactionsModule {}
