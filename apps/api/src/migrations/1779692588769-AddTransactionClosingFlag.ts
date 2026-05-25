import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Structural marker for year-end closing transactions, so reports and period-locking no longer
 * depend on matching the (localized) transaction description. Backfills existing closings.
 *
 * (The generator also wanted to rename hand-named FK constraints to its hashed convention — dropped
 * here as unrelated noise; one of those drops would have removed the retained-earnings FK, which has
 * no entity relation to regenerate it.)
 */
export class AddTransactionClosingFlag1779692588769 implements MigrationInterface {
  name = 'AddTransactionClosingFlag1779692588769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD "closing" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `UPDATE "transactions" SET "closing" = true WHERE "description" LIKE 'Year-end closing FY%' AND "posted_at" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "closing"`);
  }
}
