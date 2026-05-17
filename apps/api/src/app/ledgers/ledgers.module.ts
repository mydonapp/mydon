import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { LedgersController } from './ledgers.controller';
import { Ledger } from './ledger.entity';
import { LedgersService } from './ledgers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ledger]), OrganizationsModule, forwardRef(() => AuthModule)],
  controllers: [LedgersController],
  providers: [LedgersService],
  exports: [LedgersService, TypeOrmModule],
})
export class LedgersModule {}
