import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCategoriesToAccountGroups1778961403135 implements MigrationInterface {
  name = 'RenameCategoriesToAccountGroups1778961403135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing FK from accounts.categoryId and budget_items.categoryId to categories
    // so we can rename the parent table cleanly.
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_8e3bcf3d6dec78d095b493d9573"`);
    await queryRunner.query(`ALTER TABLE "budget_items" DROP CONSTRAINT "FK_323bdaa985811106cc1bebbc817"`);

    // Drop categories.userId FK by name (look it up first since TypeORM auto-generated it).
    await queryRunner.query(`
      DO $$
      DECLARE fk_name TEXT;
      BEGIN
        SELECT con.conname INTO fk_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'categories' AND con.contype = 'f'
        LIMIT 1;
        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "categories" DROP CONSTRAINT ' || quote_ident(fk_name);
        END IF;
      END $$;
    `);

    // Rename the table — preserves all rows + their UUIDs.
    await queryRunner.query(`ALTER TABLE "categories" RENAME TO "account_groups"`);

    // Add new columns. ledger_id is nullable until backfill completes.
    await queryRunner.query(`ALTER TABLE "account_groups" ADD COLUMN "ledger_id" uuid`);
    await queryRunner.query(`ALTER TABLE "account_groups" ADD COLUMN "code" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "account_groups" ADD COLUMN "parent_id" uuid`);

    // Backfill ledger_id: each row's userId maps via personal organization membership to a default ledger.
    await queryRunner.query(`
      UPDATE "account_groups" ag
      SET ledger_id = (
        SELECT l.id
        FROM ledgers l
        JOIN organizations o ON l.organization_id = o.id
        JOIN organization_memberships om ON om.organization_id = o.id
        WHERE om.user_id = ag."userId" AND o.kind = 'PERSONAL'
        LIMIT 1
      )
    `);

    // Drop the now-unused userId column.
    await queryRunner.query(`ALTER TABLE "account_groups" DROP COLUMN "userId"`);

    // Enforce NOT NULL on ledger_id post-backfill.
    await queryRunner.query(`ALTER TABLE "account_groups" ALTER COLUMN "ledger_id" SET NOT NULL`);

    // FK constraints (matching the TypeORM-generated names so future :generate runs see them as already-present).
    await queryRunner.query(
      `ALTER TABLE "account_groups" ADD CONSTRAINT "FK_73334cc378122482c587b0a17c0" FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_groups" ADD CONSTRAINT "FK_735092d07735e36ea67c32a5082" FOREIGN KEY ("parent_id") REFERENCES "account_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Rename FK columns on dependent tables and re-add FKs pointing at the renamed parent.
    await queryRunner.query(`ALTER TABLE "accounts" RENAME COLUMN "categoryId" TO "group_id"`);
    await queryRunner.query(`ALTER TABLE "budget_items" RENAME COLUMN "categoryId" TO "group_id"`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_d57a2ce10b95f5b5a5f6fc4f15d" FOREIGN KEY ("group_id") REFERENCES "account_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_items" ADD CONSTRAINT "FK_43958e07163d8a86290f89599c2" FOREIGN KEY ("group_id") REFERENCES "account_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: rename FK columns and table back, then re-add the old userId column.
    await queryRunner.query(`ALTER TABLE "budget_items" DROP CONSTRAINT "FK_43958e07163d8a86290f89599c2"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_d57a2ce10b95f5b5a5f6fc4f15d"`);
    await queryRunner.query(`ALTER TABLE "budget_items" RENAME COLUMN "group_id" TO "categoryId"`);
    await queryRunner.query(`ALTER TABLE "accounts" RENAME COLUMN "group_id" TO "categoryId"`);

    await queryRunner.query(`ALTER TABLE "account_groups" DROP CONSTRAINT "FK_735092d07735e36ea67c32a5082"`);
    await queryRunner.query(`ALTER TABLE "account_groups" DROP CONSTRAINT "FK_73334cc378122482c587b0a17c0"`);
    await queryRunner.query(`ALTER TABLE "account_groups" ADD COLUMN "userId" uuid`);

    // Restore userId from ledger → org → membership chain.
    await queryRunner.query(`
      UPDATE "account_groups" ag
      SET "userId" = (
        SELECT om.user_id
        FROM ledgers l
        JOIN organization_memberships om ON om.organization_id = l.organization_id
        JOIN organizations o ON o.id = l.organization_id
        WHERE l.id = ag.ledger_id AND o.kind = 'PERSONAL'
        LIMIT 1
      )
    `);
    await queryRunner.query(`ALTER TABLE "account_groups" ALTER COLUMN "userId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "account_groups" DROP COLUMN "ledger_id"`);
    await queryRunner.query(`ALTER TABLE "account_groups" DROP COLUMN "code"`);
    await queryRunner.query(`ALTER TABLE "account_groups" DROP COLUMN "parent_id"`);

    await queryRunner.query(`ALTER TABLE "account_groups" RENAME TO "categories"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_items" ADD CONSTRAINT "FK_323bdaa985811106cc1bebbc817" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_8e3bcf3d6dec78d095b493d9573" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
