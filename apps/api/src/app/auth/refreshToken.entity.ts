import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccessToken } from './accessToken.entity';
import { User } from './user.entity';

@Entity('refreshToken')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', unique: true })
  declare token: string;

  @Column({ type: 'varchar' })
  declare userAgent: string;

  @Column({ type: 'varchar' })
  declare ip: string;

  @Column({
    type: 'timestamp',
  })
  declare expiresAt: Date;

  @ManyToOne(() => User, (user) => user.refreshToken, {})
  declare user: User;

  @OneToMany(() => AccessToken, (accessToken) => accessToken.refreshToken)
  declare accessToken: AccessToken[];
}
