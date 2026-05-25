import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBudgetSubItems1779716474497 implements MigrationInterface {
  name = 'AddBudgetSubItems1779716474497';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."budget_sub_items_frequency_enum" AS ENUM('monthly', 'yearly')`);
    await queryRunner.query(
      `CREATE TABLE "budget_sub_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "frequency" "public"."budget_sub_items_frequency_enum" NOT NULL DEFAULT 'monthly', "sort_order" integer NOT NULL DEFAULT '0', "budget_item_id" uuid, CONSTRAINT "PK_1f1539c5d7357b8408d4b79b514" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_sub_items" ADD CONSTRAINT "FK_b135dec5a5259b0b3c81a572a68" FOREIGN KEY ("budget_item_id") REFERENCES "budget_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budget_sub_items" DROP CONSTRAINT "FK_b135dec5a5259b0b3c81a572a68"`);
    await queryRunner.query(`DROP TABLE "budget_sub_items"`);
    await queryRunner.query(`DROP TYPE "public"."budget_sub_items_frequency_enum"`);
  }
}
