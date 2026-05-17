import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructureAccounts1778965776054 implements MigrationInterface {
  name = 'RestructureAccounts1778965776054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new columns as nullable so we can backfill before enforcing constraints.
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "ledger_id" uuid`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "code" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "active_from" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "active_until" TIMESTAMP WITH TIME ZONE`);

    // 2. Backfill ledger_id from userId → personal org → default ledger.
    await queryRunner.query(`
      UPDATE accounts a
      SET ledger_id = (
        SELECT l.id
        FROM ledgers l
        JOIN organizations o ON l.organization_id = o.id
        JOIN organization_memberships om ON om.organization_id = o.id
        WHERE om.user_id = a."userId" AND o.kind = 'PERSONAL'
        LIMIT 1
      )
    `);

    // 3. Backfill code from account_number (stringified). Empty string when null.
    await queryRunner.query(`
      UPDATE accounts SET code = COALESCE("account_number"::text, '')
    `);

    // 4. Backfill activeFrom/activeUntil from deactivatedAt.
    //    deactivatedAt IS NULL → still active, both bounds NULL.
    //    deactivatedAt IS NOT NULL → deactivated, active_until = deactivatedAt.
    await queryRunner.query(`
      UPDATE accounts
      SET active_until = "deactivatedAt"
      WHERE "deactivatedAt" IS NOT NULL
    `);

    // 5. Enforce NOT NULL on ledger_id.
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "ledger_id" SET NOT NULL`);

    // 6. Add FK to ledgers.
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_186a2ea29d1c7336a99abc34013" FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // 7. Drop user FK + column, plus the obsolete deactivatedAt and account_number columns.
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "deactivatedAt"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "account_number"`);

    // 8. Rename the user preference column.
    await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "show_account_numbers" TO "show_account_codes"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "show_account_codes" TO "show_account_numbers"`);

    // Re-add the old columns (nullable for now).
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "account_number" integer`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "deactivatedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "userId" uuid`);

    // Restore data from new columns.
    //   account_number ← code (parsed as int; nulls if non-numeric).
    //   deactivatedAt ← active_until.
    //   userId        ← ledger → personal org membership.
    await queryRunner.query(`
      UPDATE accounts SET account_number = NULLIF(code, '')::int
      WHERE code ~ '^[0-9]+$'
    `);
    await queryRunner.query(`UPDATE accounts SET "deactivatedAt" = active_until`);
    await queryRunner.query(`
      UPDATE accounts a
      SET "userId" = (
        SELECT om.user_id
        FROM ledgers l
        JOIN organization_memberships om ON om.organization_id = l.organization_id
        JOIN organizations o ON o.id = l.organization_id
        WHERE l.id = a.ledger_id AND o.kind = 'PERSONAL'
        LIMIT 1
      )
    `);
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "userId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Drop the new columns + FK.
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_186a2ea29d1c7336a99abc34013"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "active_until"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "active_from"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "code"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "ledger_id"`);
  }
}
