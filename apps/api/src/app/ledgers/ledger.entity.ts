import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { Currency } from '../shared/currency';

@Entity('ledgers')
export class Ledger {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  declare organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  declare organization: Organization;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ name: 'base_currency', type: 'enum', enum: Currency, enumName: 'currency_enum', default: Currency.CHF })
  declare baseCurrency: Currency;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;
}
