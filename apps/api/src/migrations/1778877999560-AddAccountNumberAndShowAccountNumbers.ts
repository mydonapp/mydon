import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountNumberAndShowAccountNumbers1778877999560 implements MigrationInterface {
  name = 'AddAccountNumberAndShowAccountNumbers1778877999560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "show_account_numbers" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD "account_number" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "account_number"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "show_account_numbers"`);
  }
}
