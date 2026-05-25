import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFiscalYears1779395134971 implements MigrationInterface {
  name = 'AddFiscalYears1779395134971';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."fiscal_year_state_enum" AS ENUM('OPEN', 'CLOSING', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fiscal_years" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "ledger_id" uuid NOT NULL,
         "start_year" integer NOT NULL,
         "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
         "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
         "state" "public"."fiscal_year_state_enum" NOT NULL DEFAULT 'OPEN',
         "closing_transaction_id" uuid DEFAULT NULL,
         "closed_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
         "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
         CONSTRAINT "PK_fiscal_years" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_fiscal_year_ledger_start" ON "fiscal_years" ("ledger_id", "start_year")`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_years" ADD CONSTRAINT "FK_fiscal_years_ledger" FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fiscal_years" ADD CONSTRAINT "FK_fiscal_years_closing_transaction" FOREIGN KEY ("closing_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fiscal_years" DROP CONSTRAINT "FK_fiscal_years_closing_transaction"`);
    await queryRunner.query(`ALTER TABLE "fiscal_years" DROP CONSTRAINT "FK_fiscal_years_ledger"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_fiscal_year_ledger_start"`);
    await queryRunner.query(`DROP TABLE "fiscal_years"`);
    await queryRunner.query(`DROP TYPE "public"."fiscal_year_state_enum"`);
  }
}
