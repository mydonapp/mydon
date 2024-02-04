import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transactions.entity';
import { TransactionsController } from './transactions.controller';
import { ForexModule } from '../shared/forex/forex.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), ForexModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
