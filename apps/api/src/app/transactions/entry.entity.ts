import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from '../accounts/accounts.entity';
import { ColumnDecimalTransformer } from '../shared/decimal.transformer';
import { Transaction } from './transactions.entity';

export enum EntryDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'transaction_id', type: 'uuid' })
  declare transactionId: string;

  @ManyToOne(() => Transaction, (t) => t.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  declare transaction: Transaction;

  @Column({ name: 'account_id', type: 'uuid' })
  declare accountId: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  declare account: Account;

  @Column({ type: 'enum', enum: EntryDirection })
  declare direction: EntryDirection;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: new ColumnDecimalTransformer() })
  declare amount: number;

  @Column({ type: 'varchar', length: 3 })
  declare currency: string;

  @Column({
    name: 'fx_rate',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  declare fxRate: number;

  @Column({
    name: 'base_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  declare baseAmount: number;

  @Column({ name: 'ai_suggested', type: 'boolean', default: false })
  declare aiSuggested: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;
}
