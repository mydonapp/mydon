import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ColumnDecimalTransformer } from '../shared/decimal.transformer';
import { BudgetFrequency } from './budget-frequency.enum';
import { BudgetItem } from './budget-item.entity';

@Entity('budget_sub_items')
export class BudgetSubItem {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => BudgetItem, (item) => item.subItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_item_id' })
  declare budgetItem: BudgetItem;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  declare amount: number;

  @Column({ enum: BudgetFrequency, type: 'enum', default: BudgetFrequency.MONTHLY })
  declare frequency: BudgetFrequency;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  declare sortOrder: number;
}
