import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';
import { LedgersModule } from '../ledgers/ledgers.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AccountsModule, AuthModule, LedgersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
