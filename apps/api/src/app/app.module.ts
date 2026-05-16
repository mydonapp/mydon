import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroupsModule } from './account-groups/account-groups.module';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ExportModule } from './export/export.module';
import { LedgersModule } from './ledgers/ledgers.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { StatusModule } from './status/status.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    AccountsModule,
    TransactionsModule,
    AuthModule,
    AccountGroupsModule,
    BudgetsModule,
    ExportModule,
    OrganizationsModule,
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
