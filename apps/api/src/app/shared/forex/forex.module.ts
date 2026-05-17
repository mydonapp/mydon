import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../accounts/accounts.entity';
import { AuthModule } from '../../auth/auth.module';
import { Ledger } from '../../ledgers/ledger.entity';
import { ExchangeRate } from './exchange-rate.entity';
import { ForexController } from './forex.controller';
import { ForexScheduler } from './forex.scheduler';
import { ForexService } from './forex.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate, Ledger, Account]), AuthModule],
  controllers: [ForexController],
  providers: [ForexService, ForexScheduler],
  exports: [ForexService],
})
export class ForexModule {}
