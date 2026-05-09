import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare name: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  declare user: User;
}
