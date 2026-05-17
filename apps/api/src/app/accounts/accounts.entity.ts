import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Ledger } from '../ledgers/ledger.entity';
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

  @Column({ name: 'ledger_id', type: 'uuid' })
  declare ledgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_id' })
  declare ledger: Ledger;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'varchar', default: '' })
  declare code: string;

  @Column({ name: 'active_from', type: 'timestamptz', nullable: true, default: null })
  declare activeFrom: Date | null;

  @Column({ name: 'active_until', type: 'timestamptz', nullable: true, default: null })
  declare activeUntil: Date | null;

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

  @Column({ name: 'group_id', type: 'uuid', nullable: true, default: null })
  declare groupId: string | null;

  @ManyToOne(() => AccountGroup, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'group_id' })
  declare group: AccountGroup | null;

  get balance() {
    if (this.type === AccountType.ASSETS || this.type === AccountType.EXPENSE) {
      return (this.creditBalance || 0) - (this.debitBalance || 0) + this.openingBalance;
    } else {
      return (this.debitBalance || 0) - (this.creditBalance || 0) + this.openingBalance;
    }
  }
}
