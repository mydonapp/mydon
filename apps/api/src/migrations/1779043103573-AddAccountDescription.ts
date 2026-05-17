import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountDescription1779043103573 implements MigrationInterface {
    name = 'AddAccountDescription1779043103573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "description" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "description"`);
    }

}
