import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account } from '../accounts/accounts.entity';
import { ColumnDecimalTransformer } from '../shared/decimal.transformer';
import { BudgetFrequency } from './budget-frequency.enum';
import { BudgetSubItem } from './budget-sub-item.entity';
import { Budget } from './budgets.entity';

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => Budget, (budget) => budget.items, { onDelete: 'CASCADE' })
  declare budget: Budget;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL', eager: false })
  declare account: Account | null;

  @Column({ name: 'group_id', type: 'uuid', nullable: true, default: null })
  declare groupId: string | null;

  @ManyToOne(() => AccountGroup, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'group_id' })
  declare group: AccountGroup | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  declare amount: number;

  @Column({ enum: BudgetFrequency, type: 'enum', default: BudgetFrequency.MONTHLY })
  declare frequency: BudgetFrequency;

  @OneToMany(() => BudgetSubItem, (sub) => sub.budgetItem, { cascade: true })
  declare subItems: BudgetSubItem[];
}
