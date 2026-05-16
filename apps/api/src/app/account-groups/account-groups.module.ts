import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LedgersModule } from '../ledgers/ledgers.module';
import { AccountGroup } from './account-group.entity';
import { AccountGroupsController } from './account-groups.controller';
import { AccountGroupsService } from './account-groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccountGroup]), AuthModule, LedgersModule],
  controllers: [AccountGroupsController],
  providers: [AccountGroupsService],
  exports: [AccountGroupsService, TypeOrmModule],
})
export class AccountGroupsModule {}
