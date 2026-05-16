import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationMembership } from './organization-membership.entity';

export enum OrganizationKind {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'enum', enum: OrganizationKind, default: OrganizationKind.PERSONAL })
  declare kind: OrganizationKind;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;

  @OneToMany(() => OrganizationMembership, (m) => m.organization)
  declare memberships: OrganizationMembership[];
}
