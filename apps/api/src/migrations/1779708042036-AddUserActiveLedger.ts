import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The ledger a user is currently working in ("active books"). Backfills each existing user to the
 * earliest ledger of any org they belong to (their personal ledger today).
 *
 * (The generator also wanted to rename hand-named FK constraints to its hashed convention — dropped
 * here as unrelated noise.)
 */
export class AddUserActiveLedger1779708042036 implements MigrationInterface {
  name = 'AddUserActiveLedger1779708042036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "active_ledger_id" uuid`);
    await queryRunner.query(
      `UPDATE "user" u SET "active_ledger_id" = (
         SELECT l.id FROM "ledgers" l
         JOIN "organization_memberships" m ON m.organization_id = l.organization_id
         WHERE m.user_id = u.id
         ORDER BY l.created_at ASC
         LIMIT 1
       ) WHERE "active_ledger_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_user_active_ledger" FOREIGN KEY ("active_ledger_id") REFERENCES "ledgers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_user_active_ledger"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "active_ledger_id"`);
  }
}
