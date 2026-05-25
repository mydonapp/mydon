import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account } from '../accounts/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ChartSeederService } from './chart-seeder.service';
import { LedgersController } from './ledgers.controller';
import { Ledger } from './ledger.entity';
import { LedgersService } from './ledgers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ledger, Account, AccountGroup]),
    OrganizationsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [LedgersController],
  providers: [LedgersService, ChartSeederService],
  exports: [LedgersService, ChartSeederService, TypeOrmModule],
})
export class LedgersModule {}
