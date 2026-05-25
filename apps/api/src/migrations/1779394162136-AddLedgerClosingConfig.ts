import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLedgerClosingConfig1779394162136 implements MigrationInterface {
  name = 'AddLedgerClosingConfig1779394162136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."closing_mode_enum" AS ENUM('SIMPLE', 'ADVANCED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledgers" ADD "fiscal_year_start_month" smallint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledgers" ADD "closing_mode" "public"."closing_mode_enum" NOT NULL DEFAULT 'SIMPLE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledgers" ADD "retained_earnings_account_id" uuid DEFAULT NULL`,
    );
    // Default SIMPLE for personal orgs, ADVANCED for business orgs (matches the UX tier).
    await queryRunner.query(
      `UPDATE "ledgers" l SET "closing_mode" = 'ADVANCED'
         FROM "organizations" o
        WHERE o.id = l.organization_id AND o.kind = 'BUSINESS'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledgers" ADD CONSTRAINT "FK_ledgers_retained_earnings_account" FOREIGN KEY ("retained_earnings_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Backfill: link any existing "Retained Earnings" EQUITY account, otherwise create one per ledger
    // so every existing ledger ends up with a valid retained-earnings target.
    await queryRunner.query(
      `UPDATE "ledgers" SET "retained_earnings_account_id" = a.id
         FROM "accounts" a
        WHERE a.ledger_id = "ledgers".id
          AND a.type = 'EQUITY'
          AND a.name = 'Retained Earnings'
          AND "ledgers"."retained_earnings_account_id" IS NULL`,
    );
    await queryRunner.query(
      `WITH inserted AS (
         INSERT INTO "accounts" (ledger_id, name, description, code, type, currency)
         SELECT l.id, 'Retained Earnings', '', '', 'EQUITY', l.base_currency
           FROM "ledgers" l
          WHERE l.retained_earnings_account_id IS NULL
         RETURNING id, ledger_id
       )
       UPDATE "ledgers" SET retained_earnings_account_id = i.id
         FROM inserted i
        WHERE "ledgers".id = i.ledger_id`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ledgers" DROP CONSTRAINT "FK_ledgers_retained_earnings_account"`,
    );
    await queryRunner.query(`ALTER TABLE "ledgers" DROP COLUMN "retained_earnings_account_id"`);
    await queryRunner.query(`ALTER TABLE "ledgers" DROP COLUMN "closing_mode"`);
    await queryRunner.query(`ALTER TABLE "ledgers" DROP COLUMN "fiscal_year_start_month"`);
    await queryRunner.query(`DROP TYPE "public"."closing_mode_enum"`);
  }
}
