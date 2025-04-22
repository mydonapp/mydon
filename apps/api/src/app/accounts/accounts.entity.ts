import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { ColumnDecimalTransformer } from '../shared/decimal.transformer';
import { Transaction } from '../transactions/transactions.entity';

export enum AccountType {
  ASSETS = 'ASSETS',
  LIABILITIES = 'LIABILITIES',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Currency {
  CHF = 'CHF',
  EUR = 'EUR',
  USD = 'USD',
  KRW = 'KRW',
  GBP = 'GBP',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  private isActive: boolean;

  @Column({ default: false })
  retirementAccount: boolean;

  @Column({ enum: AccountType, type: 'enum' })
  type: AccountType;

  @Column({ enum: Currency, type: 'enum', default: Currency.CHF })
  currency: Currency;

  @OneToMany(() => Transaction, (transaction) => transaction.creditAccount)
  creditTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.debitAccount)
  debitTransactions: Transaction[];

  // @VirtualColumn({
  //   query: (alias) =>
  //     `SELECT COALESCE(SUM("creditAmount"), 0) FROM "transactions" WHERE "creditAccountId" = ${alias}.id`,
  //   type: 'decimal',
  //   transformer: new ColumnDecimalTransformer(),
  // })
  //_creditBalance: number;

  /*
  @VirtualColumn({
    query: (alias) =>
      `SELECT COALESCE(SUM("debitAmount"), 0) FROM "transactions" WHERE "debitAccountId" = ${alias}.id`,
    type: 'decimal',
    transformer: new ColumnDecimalTransformer(),
  })
  debitBalance: number;
  */
  //_debitBalance: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    select: false,
  })
  debitBalance?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    select: false,
  })
  creditBalance?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  openingBalance: number;

  @ManyToOne(() => User, (user) => user.accounts, {})
  user: User;

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

  setUserId(userId: string) {
    this.user = userId as any;
  }
}
