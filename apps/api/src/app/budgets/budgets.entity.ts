import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ledger } from '../ledgers/ledger.entity';
import { BudgetItem } from './budget-item.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'int' })
  declare year: number;

  @Column({ name: 'ledger_id', type: 'uuid' })
  declare ledgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_id' })
  declare ledger: Ledger;

  @OneToMany(() => BudgetItem, (item) => item.budget, { cascade: true })
  declare items: BudgetItem[];
}
