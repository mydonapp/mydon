import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { Currency } from '../shared/currency';

export enum ClosingMode {
  SIMPLE = 'SIMPLE',
  ADVANCED = 'ADVANCED',
}

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

  /** Month (1–12) that begins the ledger's fiscal year. Most users keep the calendar default (1). */
  @Column({ name: 'fiscal_year_start_month', type: 'smallint', default: 1 })
  declare fiscalYearStartMonth: number;

  /** SIMPLE = one-click close for individuals; ADVANCED = full workflow with period lock for businesses. */
  @Column({ name: 'closing_mode', type: 'enum', enum: ClosingMode, enumName: 'closing_mode_enum', default: ClosingMode.SIMPLE })
  declare closingMode: ClosingMode;

  /** Equity account that closing entries sweep income/expense balances into. Required for any close action. */
  @Column({ name: 'retained_earnings_account_id', type: 'uuid', nullable: true, default: null })
  declare retainedEarningsAccountId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;
}
