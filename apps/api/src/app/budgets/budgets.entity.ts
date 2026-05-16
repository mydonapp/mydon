import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { BudgetItem } from './budget-item.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'int' })
  declare year: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @OneToMany(() => BudgetItem, (item) => item.budget, { cascade: true })
  declare items: BudgetItem[];
}
