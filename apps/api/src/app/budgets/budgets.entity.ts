import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { BudgetItem } from './budget-item.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  year: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => BudgetItem, (item) => item.budget, { cascade: true })
  items: BudgetItem[];
}
