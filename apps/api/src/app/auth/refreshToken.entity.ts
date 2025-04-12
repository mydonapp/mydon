import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccessToken } from './accessToken.entity';
import { User } from './user.entity';

@Entity('refreshToken')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column()
  userAgent: string;

  @Column()
  ip: string;

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.refreshToken, {})
  user: User;

  @OneToMany(() => AccessToken, (accessToken) => accessToken.refreshToken)
  accessToken: AccessToken[];
}
