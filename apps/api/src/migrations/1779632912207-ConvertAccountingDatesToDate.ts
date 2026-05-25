import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Accounting dates are calendar days, not instants — storing them as `timestamptz` made them shift
 * across timezones when rendered (a year-end close on 2025-12-31 showed as 01.01.2026 in CET).
 * Convert them to `date`. Existing values are interpreted by their UTC calendar day (the app stored
 * form-entered dates at UTC midnight); `created_at`/`updated_at`/`posted_at` stay `timestamptz`.
 */
export class ConvertAccountingDatesToDate1779632912207 implements MigrationInterface {
  name = 'ConvertAccountingDatesToDate1779632912207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "transaction_date" TYPE date USING ("transaction_date" AT TIME ZONE 'UTC')::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "active_from" TYPE date USING ("active_from" AT TIME ZONE 'UTC')::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "active_until" TYPE date USING ("active_until" AT TIME ZONE 'UTC')::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_years" ALTER COLUMN "start_date" TYPE date USING ("start_date" AT TIME ZONE 'UTC')::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_years" ALTER COLUMN "end_date" TYPE date USING ("end_date" AT TIME ZONE 'UTC')::date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reconstitute as timestamptz at UTC midnight of the stored day.
    await queryRunner.query(
      `ALTER TABLE "fiscal_years" ALTER COLUMN "end_date" TYPE timestamptz USING "end_date"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_years" ALTER COLUMN "start_date" TYPE timestamptz USING "start_date"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "active_until" TYPE timestamptz USING "active_until"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "active_from" TYPE timestamptz USING "active_from"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "transaction_date" TYPE timestamptz USING "transaction_date"::timestamptz`,
    );
  }
}
