import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ledger } from '../ledgers/ledger.entity';
import { Entry } from './entry.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'ledger_id', type: 'uuid' })
  declare ledgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_id' })
  declare ledger: Ledger;

  @Column({ type: 'varchar', default: '' })
  declare description: string;

  @Column({ type: 'varchar', nullable: true })
  declare reference: string | null;

  /** Accounting date (calendar day, no time/zone) — 'YYYY-MM-DD'. */
  @Column({ name: 'transaction_date', type: 'date' })
  declare transactionDate: string;

  /**
   * When `postedAt IS NULL` the transaction is a draft and may be patched freely.
   * Once posted (postedAt set) the transaction is immutable; corrections happen via a reversing transaction.
   */
  @Column({ name: 'posted_at', type: 'timestamptz', nullable: true, default: null })
  declare postedAt: Date | null;

  @Column({ name: 'reverses_transaction_id', type: 'uuid', nullable: true, default: null })
  declare reversesTransactionId: string | null;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'reverses_transaction_id' })
  declare reverses: Transaction | null;

  /** Year-end closing entry. Structural marker so reports/locking don't depend on the (localized) description. */
  @Column({ type: 'boolean', default: false })
  declare closing: boolean;

  @Column({ type: 'varchar', nullable: true })
  declare raw: string | null;

  @OneToMany(() => Entry, (entry) => entry.transaction, { cascade: true })
  declare entries: Entry[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  declare updatedAt: Date;
}
