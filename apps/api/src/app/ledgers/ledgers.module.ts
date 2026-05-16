import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsModule } from '../organizations/organizations.module';
import { Ledger } from './ledger.entity';
import { LedgersService } from './ledgers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ledger]), OrganizationsModule],
  providers: [LedgersService],
  exports: [LedgersService, TypeOrmModule],
})
export class LedgersModule {}
