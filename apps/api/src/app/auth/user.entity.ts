import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from '../transactions/transactions.entity';
import { AccessToken } from './accessToken.entity';
import { RefreshToken } from './refreshToken.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'varchar', unique: true })
  declare email: string;

  @Column({ type: 'varchar' })
  declare password: string;

  @Column({ type: 'varchar', default: 'en' })
  declare language: string;

  @Column({ type: 'varchar', default: 'system' })
  declare theme: string;

  @Column({ type: 'varchar', name: 'list_style', default: 'normal' })
  declare listStyle: string;

  @Column({ type: 'boolean', name: 'privacy_mode', default: false })
  declare privacyMode: boolean;

  @Column({ type: 'boolean', name: 'show_account_codes', default: false })
  declare showAccountCodes: boolean;

  @OneToMany(() => AccessToken, (accessToken) => accessToken.user)
  declare accessToken: AccessToken[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  declare refreshToken: RefreshToken[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  declare transactions: Transaction[];
}
