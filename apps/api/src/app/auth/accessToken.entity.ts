import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RefreshToken } from './refreshToken.entity';
import { User } from './user.entity';

@Entity('accessToken')
export class AccessToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.accessToken, {})
  user: User;

  @ManyToOne(() => RefreshToken, (refreshToken) => refreshToken.accessToken, {
    onDelete: 'CASCADE',
  })
  refreshToken: RefreshToken;
}
