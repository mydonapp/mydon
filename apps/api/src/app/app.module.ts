import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroupsModule } from './account-groups/account-groups.module';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ClosingsModule } from './closings/closings.module';
import { ExportModule } from './export/export.module';
import { LedgersModule } from './ledgers/ledgers.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ReportsModule } from './reports/reports.module';
import { StatusModule } from './status/status.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ScheduleModule.forRoot(),
    AccountsModule,
    TransactionsModule,
    AuthModule,
    AccountGroupsModule,
    BudgetsModule,
    ClosingsModule,
    ExportModule,
    OrganizationsModule,
    ReportsModule,
    LedgersModule,
    StatusModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_POSTGRES_HOST'),
        port: configService.get('DB_POSTGRES_PORT'),
        username: 'postgres',
        password: configService.get('DB_POSTGRES_PASSWORD'),
        database: 'don',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
