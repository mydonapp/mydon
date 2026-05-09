import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from '../accounts/accounts.entity';
import { Category } from '../categories/categories.entity';
import { ColumnDecimalTransformer } from '../shared/decimal.transformer';
import { Budget } from './budgets.entity';

export enum BudgetFrequency {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => Budget, (budget) => budget.items, { onDelete: 'CASCADE' })
  declare budget: Budget;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL', eager: false })
  declare account: Account | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL', eager: false })
  declare category: Category | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  declare amount: number;

  @Column({ enum: BudgetFrequency, type: 'enum', default: BudgetFrequency.MONTHLY })
  declare frequency: BudgetFrequency;
}
