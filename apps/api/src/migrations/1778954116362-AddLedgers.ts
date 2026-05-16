import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLedgers1778954116362 implements MigrationInterface {
    name = 'AddLedgers1778954116362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ledgers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying NOT NULL, "base_currency" character varying(3) NOT NULL DEFAULT 'CHF', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e8af998892a129f7cf69285d601" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ledgers" ADD CONSTRAINT "FK_259cd80c925a5d9c60478010be2" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Backfill: every existing organization gets one default "Main" ledger with CHF base currency.
        await queryRunner.query(`
            INSERT INTO ledgers (organization_id, name, base_currency)
            SELECT id, 'Main', 'CHF' FROM organizations
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ledgers" DROP CONSTRAINT "FK_259cd80c925a5d9c60478010be2"`);
        await queryRunner.query(`DROP TABLE "ledgers"`);
    }

}
