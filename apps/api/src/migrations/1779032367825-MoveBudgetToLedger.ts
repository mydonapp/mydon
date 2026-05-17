import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveBudgetToLedger1779032367825 implements MigrationInterface {
  name = 'MoveBudgetToLedger1779032367825';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the old user FK and add ledger_id as nullable so we can backfill first.
    await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_27e688ddf1ff3893b43065899f9"`);
    await queryRunner.query(`ALTER TABLE "budgets" ADD COLUMN "ledger_id" uuid`);

    // 2. Backfill ledger_id from userId → personal org → default ledger.
    await queryRunner.query(`
      UPDATE budgets b
      SET ledger_id = (
        SELECT l.id
        FROM ledgers l
        JOIN organizations o ON l.organization_id = o.id
        JOIN organization_memberships om ON om.organization_id = o.id
        WHERE om.user_id = b."userId" AND o.kind = 'PERSONAL'
        LIMIT 1
      )
    `);

    // 3. Guard: every budget must have resolved to a ledger.
    const orphans = await queryRunner.query(`SELECT COUNT(*)::int AS c FROM budgets WHERE ledger_id IS NULL`);
    if (orphans[0].c > 0) {
      throw new Error(
        `${orphans[0].c} budget(s) could not be mapped to a ledger (user has no personal organization). Aborting.`,
      );
    }

    // 4. Enforce NOT NULL, add FK to ledgers, drop the old user column.
    await queryRunner.query(`ALTER TABLE "budgets" ALTER COLUMN "ledger_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_a2950ba2de5cd8c42ffb1ee8e55" FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "budgets" DROP COLUMN "userId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Re-add userId as nullable, backfill from ledger → personal org → owner.
    await queryRunner.query(`ALTER TABLE "budgets" ADD COLUMN "userId" uuid`);
    await queryRunner.query(`
      UPDATE budgets b
      SET "userId" = (
        SELECT om.user_id
        FROM ledgers l
        JOIN organizations o ON l.organization_id = o.id
        JOIN organization_memberships om ON om.organization_id = o.id
        WHERE l.id = b.ledger_id AND o.kind = 'PERSONAL'
        LIMIT 1
      )
    `);

    const orphans = await queryRunner.query(`SELECT COUNT(*)::int AS c FROM budgets WHERE "userId" IS NULL`);
    if (orphans[0].c > 0) {
      throw new Error(`${orphans[0].c} budget(s) could not be mapped back to a user. Aborting.`);
    }

    // 2. Restore NOT NULL + user FK, drop ledger_id.
    await queryRunner.query(`ALTER TABLE "budgets" ALTER COLUMN "userId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_a2950ba2de5cd8c42ffb1ee8e55"`);
    await queryRunner.query(`ALTER TABLE "budgets" DROP COLUMN "ledger_id"`);
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_27e688ddf1ff3893b43065899f9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
