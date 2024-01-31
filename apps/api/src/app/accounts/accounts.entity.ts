import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  VirtualColumn,
} from 'typeorm';
import { Transaction } from '../transactions/transactions.entity';
import { ColumnDecimalTransformer } from '../shared/decimal.transformer';

export enum AccountType {
  ASSETS = 'ASSETS',
  LIABILITIES = 'LIABILITIES',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  private isActive: boolean;

  @Column({ enum: AccountType, type: 'enum' })
  type: AccountType;

  @OneToMany(() => Transaction, (transaction) => transaction.creditAccount)
  creditTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.debitAccount)
  debitTransactions: Transaction[];

  @VirtualColumn({
    query: (alias) =>
      `SELECT COALESCE(SUM(amount), 0) FROM "transactions" WHERE "creditAccountId" = ${alias}.id`,
    type: 'decimal',
    transformer: new ColumnDecimalTransformer(),
  })
  creditBalance: number;

  @VirtualColumn({
    query: (alias) =>
      `SELECT COALESCE(SUM(amount), 0) FROM "transactions" WHERE "debitAccountId" = ${alias}.id`,
    type: 'decimal',
    transformer: new ColumnDecimalTransformer(),
  })
  debitBalance: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  openingBalance: number;

  setInactive() {
    this.isActive = false;
  }

  get balance() {
    if (this.type === AccountType.ASSETS || this.type === AccountType.EXPENSE) {
      return this.creditBalance - this.debitBalance + this.openingBalance;
    } else {
      return this.debitBalance - this.creditBalance + this.openingBalance;
    }
  }
}
