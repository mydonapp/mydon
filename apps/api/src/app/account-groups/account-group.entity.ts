import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ledger } from '../ledgers/ledger.entity';

@Entity('account_groups')
export class AccountGroup {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'ledger_id', type: 'uuid' })
  declare ledgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_id' })
  declare ledger: Ledger;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'varchar', default: '' })
  declare code: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true, default: null })
  declare parentId: string | null;

  @ManyToOne(() => AccountGroup, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  declare parent: AccountGroup | null;
}
