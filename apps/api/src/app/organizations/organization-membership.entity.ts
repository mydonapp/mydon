import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Organization } from './organization.entity';

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  ACCOUNTANT = 'ACCOUNTANT',
}

@Entity('organization_memberships')
export class OrganizationMembership {
  @PrimaryColumn({ name: 'organization_id', type: 'uuid' })
  declare organizationId: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @ManyToOne(() => Organization, (o) => o.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  declare organization: Organization;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ type: 'enum', enum: OrganizationRole, default: OrganizationRole.OWNER })
  declare role: OrganizationRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;
}
