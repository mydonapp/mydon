import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RefreshToken } from './refreshToken.entity';
import { User } from './user.entity';

@Entity('accessToken')
export class AccessToken {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', unique: true })
  declare token: string;

  @Column({
    type: 'timestamp',
  })
  declare expiresAt: Date;

  @ManyToOne(() => User, (user) => user.accessToken, {})
  declare user: User;

  @ManyToOne(() => RefreshToken, (refreshToken) => refreshToken.accessToken, {
    onDelete: 'CASCADE',
  })
  declare refreshToken: RefreshToken;
}
