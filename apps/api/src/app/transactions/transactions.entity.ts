import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../accounts/accounts.entity';
import { User } from '../auth/user.entity';
import { ColumnDecimalTransformer } from '../shared/decimal.transformer';

export interface CreateTransaction {
  creditAmount: number;
  debitAmount: number;
  description: string;
  creditAccountId?: string;
  debitAccountId?: string;
  transactionDate: Date;
  userId: string;
  draft?: boolean;
  raw?: string;
  creditAccountAISuggested?: boolean;
  debitAccountAISuggested?: boolean;
  matchedTransactionId?: string;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  declare creditAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  declare debitAmount: number;

  @Column({ type: 'varchar', default: '' })
  declare description: string;

  @Column({ type: 'boolean', default: false })
  declare draft: boolean;

  @Column({ type: 'boolean', default: false })
  declare creditAccountAISuggested: boolean;

  @Column({ type: 'boolean', default: false })
  declare debitAccountAISuggested: boolean;

  @Column({ type: 'varchar', nullable: true })
  declare matchedTransactionId: string | null;

  @ManyToOne(() => Account, (account) => account.creditTransactions, {
    nullable: true,
  })
  declare creditAccount: Account;

  @ManyToOne(() => Account, (account) => account.debitTransactions, {
    nullable: true,
  })
  declare debitAccount: Account;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  declare createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  declare updatedAt: Date;

  @Column({ type: 'timestamp' })
  declare transactionDate: Date;

  @Column({ type: 'varchar', nullable: true })
  declare raw: string | null;

  @ManyToOne(() => User, (user) => user.transactions, {})
  declare user: User;

  @BeforeInsert()
  @BeforeUpdate()
  private validate() {
    if (!this.creditAccount || !this.debitAccount || this.description === '') {
      this.draft = true;
    }

    if (this.creditAccount || this.creditAccount?.id) {
      if ((this.creditAccount?.id || this.creditAccount) === (this.debitAccount?.id || this.debitAccount)) {
        throw new Error('Credit and debit accounts cannot be the same');
      }
    }

    if (this.creditAmount < 0 || this.debitAmount < 0) {
      throw new Error('Amount must be greater or equal than 0');
    }
  }

  public static create(props: CreateTransaction): Transaction {
    const transaction = new Transaction();
    transaction.creditAmount = props.creditAmount;
    transaction.debitAmount = props.debitAmount;
    transaction.description = props.description;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction.creditAccount = props.creditAccountId as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction.debitAccount = props.debitAccountId as any;
    transaction.transactionDate = props.transactionDate;
    transaction.draft = props.draft || false;
    transaction.raw = props.raw || null;
    transaction.creditAccountAISuggested = props.creditAccountAISuggested || false;
    transaction.debitAccountAISuggested = props.debitAccountAISuggested || false;
    transaction.matchedTransactionId = props.matchedTransactionId || null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction.user = props.userId as any;
    return transaction;
  }
}
