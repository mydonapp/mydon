import { MigrationInterface, QueryRunner } from 'typeorm';

const SUPPORTED = [
  'CHF',
  'EUR',
  'USD',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CNY',
  'KRW',
  'INR',
  'SGD',
  'HKD',
  'NZD',
  'SEK',
  'NOK',
];

const OLD_ACCOUNTS_ENUM = ['CHF', 'EUR', 'USD', 'KRW', 'GBP'];

export class UnifyCurrencyEnum1779022385203 implements MigrationInterface {
  name = 'UnifyCurrencyEnum1779022385203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Pre-flight: every currency value already in the DB must be in the new enum, otherwise the
    // USING cast will silently emit NULLs (for varchar columns) or fail loudly (for enum columns).
    // Better to halt now with a clear message.
    const inList = SUPPORTED.map((c) => `'${c}'`).join(', ');
    const offenders = await queryRunner.query(
      `SELECT 'ledgers.base_currency' AS col, base_currency AS value FROM ledgers WHERE base_currency NOT IN (${inList})
       UNION ALL SELECT 'entries.currency', currency::text FROM entries WHERE currency::text NOT IN (${inList})
       UNION ALL SELECT 'exchange_rates.from_currency', from_currency FROM exchange_rates WHERE from_currency NOT IN (${inList})
       UNION ALL SELECT 'exchange_rates.to_currency', to_currency FROM exchange_rates WHERE to_currency NOT IN (${inList})`,
    );
    if (offenders.length > 0) {
      throw new Error(
        `Unsupported currency values present, cannot migrate: ${JSON.stringify(offenders)}. ` +
          `Either remove those rows or add the currency to the Currency enum first.`,
      );
    }

    // 1. Shared enum type.
    await queryRunner.query(`CREATE TYPE "public"."currency_enum" AS ENUM(${inList})`);

    // 2. ledgers.base_currency : varchar(3) → currency_enum
    await queryRunner.query(`ALTER TABLE "ledgers" ALTER COLUMN "base_currency" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "ledgers" ALTER COLUMN "base_currency" TYPE "public"."currency_enum" USING "base_currency"::"public"."currency_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "ledgers" ALTER COLUMN "base_currency" SET DEFAULT 'CHF'`);

    // 3. accounts.currency : accounts_currency_enum → currency_enum
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "currency" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "currency" TYPE "public"."currency_enum" USING "currency"::text::"public"."currency_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'CHF'`);
    await queryRunner.query(`DROP TYPE "public"."accounts_currency_enum"`);

    // 4. entries.currency : varchar(3) → currency_enum
    await queryRunner.query(
      `ALTER TABLE "entries" ALTER COLUMN "currency" TYPE "public"."currency_enum" USING "currency"::"public"."currency_enum"`,
    );

    // 5. exchange_rates.from_currency / to_currency : varchar(3) → currency_enum
    // The composite PK can stay in place; ALTER COLUMN TYPE rewrites in-place.
    await queryRunner.query(
      `ALTER TABLE "exchange_rates" ALTER COLUMN "from_currency" TYPE "public"."currency_enum" USING "from_currency"::"public"."currency_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exchange_rates" ALTER COLUMN "to_currency" TYPE "public"."currency_enum" USING "to_currency"::"public"."currency_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: convert each column back to its prior type, then drop the shared enum.
    const oldList = OLD_ACCOUNTS_ENUM.map((c) => `'${c}'`).join(', ');

    // exchange_rates: enum → varchar(3)
    await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "to_currency" TYPE character varying(3) USING "to_currency"::text`);
    await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "from_currency" TYPE character varying(3) USING "from_currency"::text`);

    // entries: enum → varchar(3)
    await queryRunner.query(`ALTER TABLE "entries" ALTER COLUMN "currency" TYPE character varying(3) USING "currency"::text`);

    // accounts: shared enum → restored accounts_currency_enum
    await queryRunner.query(`CREATE TYPE "public"."accounts_currency_enum" AS ENUM(${oldList})`);
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "currency" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "currency" TYPE "public"."accounts_currency_enum" USING "currency"::text::"public"."accounts_currency_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'CHF'`);

    // ledgers: enum → varchar(3)
    await queryRunner.query(`ALTER TABLE "ledgers" ALTER COLUMN "base_currency" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "ledgers" ALTER COLUMN "base_currency" TYPE character varying(3) USING "base_currency"::text`);
    await queryRunner.query(`ALTER TABLE "ledgers" ALTER COLUMN "base_currency" SET DEFAULT 'CHF'`);

    await queryRunner.query(`DROP TYPE "public"."currency_enum"`);
  }
}
