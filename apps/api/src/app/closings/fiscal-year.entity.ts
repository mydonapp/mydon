import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ledger } from '../ledgers/ledger.entity';
import { Transaction } from '../transactions/transactions.entity';

export enum FiscalYearState {
  /** No close has been started — the period accepts normal transactions. */
  OPEN = 'OPEN',
  /** Closing draft generated; user is reviewing and may still patch the closing transaction. */
  CLOSING = 'CLOSING',
  /** Closing transaction posted; the period is locked against further postings. */
  CLOSED = 'CLOSED',
}

@Entity('fiscal_years')
@Index('UQ_fiscal_year_ledger_start', ['ledgerId', 'startYear'], { unique: true })
export class FiscalYear {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'ledger_id', type: 'uuid' })
  declare ledgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_id' })
  declare ledger: Ledger;

  /** Year that contains the fiscal year start month (e.g. 2025 for FY 2025/26 when start month ≠ January). */
  @Column({ name: 'start_year', type: 'int' })
  declare startYear: number;

  @Column({ name: 'start_date', type: 'date' })
  declare startDate: string;

  /** Exclusive — the first day of the *next* fiscal year. */
  @Column({ name: 'end_date', type: 'date' })
  declare endDate: string;

  @Column({ type: 'enum', enum: FiscalYearState, enumName: 'fiscal_year_state_enum', default: FiscalYearState.OPEN })
  declare state: FiscalYearState;

  @Column({ name: 'closing_transaction_id', type: 'uuid', nullable: true, default: null })
  declare closingTransactionId: string | null;

  @ManyToOne(() => Transaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closing_transaction_id' })
  declare closingTransaction: Transaction | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true, default: null })
  declare closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;
}
