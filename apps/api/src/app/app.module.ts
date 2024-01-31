import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    AccountsModule,
    TransactionsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5500,
      username: 'postgres',
      password: 'mysecretpassword',
      database: 'don',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
