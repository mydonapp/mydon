import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ForexModule } from '../shared/forex/forex.module';
import { TransactionMatcherService } from './transaction-matcher.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './transactions.entity';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), ForexModule, AuthModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionMatcherService],
})
export class TransactionsModule {}
