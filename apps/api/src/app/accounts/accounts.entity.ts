import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Category } from '../categories/categories.entity';
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
  declare id: string;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ nullable: true, type: 'timestamptz', default: null })
  declare deactivatedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  declare retirementAccount: boolean;

  @Column({ enum: AccountType, type: 'enum' })
  declare type: AccountType;

  @Column({ enum: Currency, type: 'enum', default: Currency.CHF })
  declare currency: Currency;

  @OneToMany(() => Transaction, (transaction) => transaction.creditAccount)
  declare creditTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.debitAccount)
  declare debitTransactions: Transaction[];

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
  declare openingBalance: number;

  @Column({ name: 'account_number', nullable: true, type: 'int', default: null })
  declare accountNumber: number | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL', eager: false })
  declare category: Category | null;

  @ManyToOne(() => User, (user) => user.accounts, {})
  declare user: User;

  get isActive(): boolean {
    return this.deactivatedAt === null;
  }

  get balance() {
    if (this.type === AccountType.ASSETS || this.type === AccountType.EXPENSE) {
      return (this.creditBalance || 0) - (this.debitBalance || 0) + this.openingBalance;
    } else {
      return (this.debitBalance || 0) - (this.creditBalance || 0) + this.openingBalance;
    }
  }

  setUserId(userId: string) {
    this.user = userId as unknown as User;
  }
}
