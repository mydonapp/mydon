import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { AuthModule } from '../auth/auth.module';
import { LedgersModule } from '../ledgers/ledgers.module';
import { ForexModule } from '../shared/forex/forex.module';
import { AccountsController } from './accounts.controller';
import { Account } from './accounts.entity';
import { AccountsService } from './accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, AccountGroup]), ForexModule, AuthModule, LedgersModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
