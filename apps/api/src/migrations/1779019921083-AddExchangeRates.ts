import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExchangeRates1779019921083 implements MigrationInterface {
    name = 'AddExchangeRates1779019921083'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "exchange_rates" ("date" date NOT NULL, "from_currency" character varying(3) NOT NULL, "to_currency" character varying(3) NOT NULL, "rate" numeric(18,8) NOT NULL, "source" character varying NOT NULL DEFAULT 'frankfurter', CONSTRAINT "PK_fcb6efca14d6872471e33cdb2c5" PRIMARY KEY ("date", "from_currency", "to_currency"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "updated_at" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "created_at" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`DROP TABLE "exchange_rates"`);
    }

}
