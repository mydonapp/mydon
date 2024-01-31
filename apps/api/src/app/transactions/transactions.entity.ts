import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';
import { Account } from '../accounts/accounts.entity';

export interface CreateTransaction {
  amount: number;
  description: string;
  creditAccountId: string;
  debitAccountId: string;
  transactionDate: Date;
  draft?: boolean;
  raw?: string;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: '' })
  description: string;

  @Column({ default: false })
  draft: boolean;

  @ManyToOne(() => Account, (account) => account.creditTransactions, {
    nullable: true,
  })
  creditAccount: Account;

  @ManyToOne(() => Account, (account) => account.debitTransactions, {
    nullable: true,
  })
  debitAccount: Account;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @Column({ type: 'timestamp' })
  transactionDate: Date;

  @Column({ nullable: true })
  raw: string;

  @BeforeInsert()
  @BeforeUpdate()
  private validate() {
    if (!this.creditAccount || !this.debitAccount || this.description === '') {
      this.draft = true;
    }

    if (this.creditAccount || this.creditAccount?.id) {
      if (
        (this.creditAccount?.id || this.creditAccount) ===
        (this.debitAccount?.id || this.debitAccount)
      ) {
        throw new Error('Credit and debit accounts cannot be the same');
      }
    }

    if (this.amount < 0) {
      throw new Error('Amount must be greater or equal than 0');
    }
  }

  public static create(props: CreateTransaction): Transaction {
    console.log(props);
    const transaction = new Transaction();
    transaction.amount = props.amount;
    transaction.description = props.description;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction.creditAccount = props.creditAccountId as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction.debitAccount = props.debitAccountId as any;
    transaction.transactionDate = props.transactionDate;
    transaction.draft = props.draft || false;
    transaction.raw = props.raw || null;
    return transaction;
  }
}
