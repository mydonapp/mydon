import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from '../accounts/accounts.entity';
import { Transaction } from '../transactions/transactions.entity';
import { AccessToken } from './accessToken.entity';
import { RefreshToken } from './refreshToken.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare name: string;

  @Column({ unique: true })
  declare email: string;

  @Column()
  declare password: string;

  @OneToMany(() => AccessToken, (accessToken) => accessToken.user)
  declare accessToken: AccessToken[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  declare refreshToken: RefreshToken[];

  @OneToMany(() => Account, (account) => account.user)
  declare accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  declare transactions: Transaction[];
}
