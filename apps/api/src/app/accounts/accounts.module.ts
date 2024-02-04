import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './accounts.entity';
import { ForexModule } from '../shared/forex/forex.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), ForexModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
