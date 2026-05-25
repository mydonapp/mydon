import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Ledger } from '../ledgers/ledger.entity';
import { Currency } from '../shared/currency';

export { Currency };

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
  declare id: string;

  @Column({ name: 'ledger_id', type: 'uuid' })
  declare ledgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_id' })
  declare ledger: Ledger;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'varchar', default: '' })
  declare description: string;

  @Column({ type: 'varchar', default: '' })
  declare code: string;

  @Column({ name: 'active_from', type: 'date', nullable: true, default: null })
  declare activeFrom: string | null;

  @Column({ name: 'active_until', type: 'date', nullable: true, default: null })
  declare activeUntil: string | null;

  @Column({ type: 'boolean', default: false })
  declare retirementAccount: boolean;

  @Column({ enum: AccountType, type: 'enum' })
  declare type: AccountType;

  @Column({ enum: Currency, type: 'enum', enumName: 'currency_enum', default: Currency.CHF })
  declare currency: Currency;

  @Column({ name: 'group_id', type: 'uuid', nullable: true, default: null })
  declare groupId: string | null;

  @ManyToOne(() => AccountGroup, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'group_id' })
  declare group: AccountGroup | null;
}
