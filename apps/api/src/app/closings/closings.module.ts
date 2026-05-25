import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { LedgersModule } from '../ledgers/ledgers.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { Transaction } from '../transactions/transactions.entity';
import { ClosingsController } from './closings.controller';
import { ClosingsService } from './closings.service';
import { FiscalYear } from './fiscal-year.entity';
import { FiscalYearsController } from './fiscal-years.controller';
import { FiscalYearsService } from './fiscal-years.service';
import { PeriodLockModule } from './period-lock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Transaction, FiscalYear]),
    AuthModule,
    LedgersModule,
    TransactionsModule,
    PeriodLockModule,
  ],
  controllers: [ClosingsController, FiscalYearsController],
  providers: [ClosingsService, FiscalYearsService],
  exports: [ClosingsService, FiscalYearsService],
})
export class ClosingsModule {}
