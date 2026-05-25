import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalYear } from './fiscal-year.entity';
import { PeriodLockService } from './period-lock.service';

/**
 * Standalone module so TransactionsModule can use the closed-period guard without importing
 * ClosingsModule (which depends on TransactionsModule). Keeps the dependency graph acyclic.
 */
@Module({
  imports: [TypeOrmModule.forFeature([FiscalYear])],
  providers: [PeriodLockService],
  exports: [PeriodLockService],
})
export class PeriodLockModule {}
