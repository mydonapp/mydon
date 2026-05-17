import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationsAndMemberships1778934643756 implements MigrationInterface {
  name = 'AddOrganizationsAndMemberships1778934643756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."organizations_kind_enum" AS ENUM('PERSONAL', 'BUSINESS')`);
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "kind" "public"."organizations_kind_enum" NOT NULL DEFAULT 'PERSONAL', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_memberships_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'ACCOUNTANT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_memberships" ("organization_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."organization_memberships_role_enum" NOT NULL DEFAULT 'OWNER', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_caa73db1b161fa6b3a042290fe7" PRIMARY KEY ("organization_id", "user_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_86ae2efbb9ce84dd652e0c96a49" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_5352fc550034d507d6c76dd2901" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Backfill: every existing user gets one PERSONAL organization with an OWNER membership.
    // Use a temp mapping table to keep the user→org pairing deterministic even when users share a name.
    await queryRunner.query(`
            CREATE TEMPORARY TABLE _user_org_map ON COMMIT DROP AS
              SELECT u.id AS user_id, uuid_generate_v4() AS org_id, u.name
              FROM "user" u
        `);
    await queryRunner.query(`
            INSERT INTO organizations (id, name, kind)
            SELECT org_id, name, 'PERSONAL' FROM _user_org_map
        `);
    await queryRunner.query(`
            INSERT INTO organization_memberships (organization_id, user_id, role)
            SELECT org_id, user_id, 'OWNER' FROM _user_org_map
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_5352fc550034d507d6c76dd2901"`);
    await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_86ae2efbb9ce84dd652e0c96a49"`);
    await queryRunner.query(`DROP TABLE "organization_memberships"`);
    await queryRunner.query(`DROP TYPE "public"."organization_memberships_role_enum"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_kind_enum"`);
  }
}
