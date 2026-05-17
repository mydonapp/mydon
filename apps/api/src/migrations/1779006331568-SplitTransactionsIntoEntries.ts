import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5 — Split single-row Transactions into Transaction (header) + N Entry (legs).
 *
 * Strategy:
 * 1. Add the `entries` table and additive columns on `transactions` (ledger_id, posted_at, etc.).
 * 2. Backfill: every existing transaction → 2 entries. The legacy data had `creditAccountId` =
 *    the account that *gained value* (money in) and `debitAccountId` = the account that *lost*
 *    value — inverted relative to standard double-entry. Correct that here by mapping the old
 *    `creditAccount*` columns onto a DEBIT entry and the old `debitAccount*` columns onto a
 *    CREDIT entry, so after the migration entry directions follow proper accounting
 *    (DEBIT increases ASSETS/EXPENSE; CREDIT increases LIABILITIES/EQUITY/INCOME). The API,
 *    statement mappers, and frontend are updated in lockstep to use the corrected semantics
 *    going forward — no compensating translation in the app code.
 * 3. Opening balances on accounts → one journal entry per account against a per-ledger
 *    "Opening Balance Equity" (OBE) account, posted with correct DR/CR directions.
 * 4. Drop the obsoleted single-row columns on `transactions` and the cache columns on `accounts`.
 */
export class SplitTransactionsIntoEntries1779006331568 implements MigrationInterface {
  name = 'SplitTransactionsIntoEntries1779006331568';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Drop FK constraints that block the column operations.
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_21f72e8648cfdda83b257a87fcc"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_6bb58f2b6e30cb51a6504599f41"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_f38ae5f1c4438d5a59639f9b41e"`);

    // 1. Create `entries` table.
    await queryRunner.query(`CREATE TYPE "public"."entries_direction_enum" AS ENUM('DEBIT', 'CREDIT')`);
    await queryRunner.query(
      `CREATE TABLE "entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" uuid NOT NULL,
        "account_id" uuid NOT NULL,
        "direction" "public"."entries_direction_enum" NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "currency" character varying(3) NOT NULL,
        "fx_rate" numeric(18,8) NOT NULL DEFAULT '1',
        "base_amount" numeric(14,2) NOT NULL,
        "ai_suggested" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_23d4e7e9b58d9939f113832915b" PRIMARY KEY ("id")
      )`,
    );

    // 2. Add new columns to `transactions` (nullable initially).
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "ledger_id" uuid`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "reference" character varying`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "posted_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "reverses_transaction_id" uuid`);

    // 3. Backfill ledger_id from each transaction's userId → personal org → default ledger.
    await queryRunner.query(`
      UPDATE transactions tx
      SET ledger_id = (
        SELECT l.id
        FROM ledgers l
        JOIN organizations o ON l.organization_id = o.id
        JOIN organization_memberships om ON om.organization_id = o.id
        WHERE om.user_id = tx."userId" AND o.kind = 'PERSONAL'
        LIMIT 1
      )
    `);

    // 4. Backfill posted_at: draft=true → null; draft=false → createdAt (i.e. effectively posted-at-creation).
    await queryRunner.query(`UPDATE transactions SET posted_at = CASE WHEN draft THEN NULL ELSE "createdAt" END`);

    // 5. Enforce NOT NULL on ledger_id post-backfill and add FKs.
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "ledger_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_9fce29225a17afdfae8dd441ff6" FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_de51b51eea51f759c29f557ff22" FOREIGN KEY ("reverses_transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 6. Backfill entries from existing transactions.
    //    The legacy `creditAccountId` (= account that gained value) maps to a DEBIT entry,
    //    and the legacy `debitAccountId` (= account that lost value) maps to a CREDIT entry.
    //    This corrects the historic mix-up so subsequent balance math follows proper accounting.
    await queryRunner.query(`
      INSERT INTO entries (transaction_id, account_id, direction, amount, currency, fx_rate, base_amount, ai_suggested)
      SELECT tx.id, tx."creditAccountId", 'DEBIT', tx."creditAmount", a.currency, 1, tx."creditAmount", COALESCE(tx."creditAccountAISuggested", false)
      FROM transactions tx
      JOIN accounts a ON a.id = tx."creditAccountId"
      WHERE tx."creditAccountId" IS NOT NULL
    `);
    await queryRunner.query(`
      INSERT INTO entries (transaction_id, account_id, direction, amount, currency, fx_rate, base_amount, ai_suggested)
      SELECT tx.id, tx."debitAccountId", 'CREDIT', tx."debitAmount", a.currency, 1, tx."debitAmount", COALESCE(tx."debitAccountAISuggested", false)
      FROM transactions tx
      JOIN accounts a ON a.id = tx."debitAccountId"
      WHERE tx."debitAccountId" IS NOT NULL
    `);

    // 7. Opening balances → journal entries against per-ledger "Opening Balance Equity".
    // Create an OBE account per ledger that has at least one nonzero-OB account.
    await queryRunner.query(`
      INSERT INTO accounts (ledger_id, name, code, type, currency)
      SELECT DISTINCT a.ledger_id, 'Opening Balance Equity', 'OBE',
             'EQUITY'::"accounts_type_enum", 'CHF'::"accounts_currency_enum"
      FROM accounts a
      WHERE a."openingBalance" IS NOT NULL AND a."openingBalance" <> 0
        AND NOT EXISTS (
          SELECT 1 FROM accounts a2 WHERE a2.ledger_id = a.ledger_id AND a2.code = 'OBE' AND a2.type = 'EQUITY'
        )
    `);

    // For each account with a nonzero opening balance, create a journal entry transaction.
    const obRows = (await queryRunner.query(`
      SELECT a.id, a.ledger_id, a.type, a.currency, a."openingBalance"::float AS opening_balance
      FROM accounts a
      WHERE a."openingBalance" IS NOT NULL AND a."openingBalance" <> 0
    `)) as { id: string; ledger_id: string; type: string; currency: string; opening_balance: number }[];

    for (const a of obRows) {
      const obeResult = (await queryRunner.query(
        `SELECT id FROM accounts WHERE ledger_id = $1 AND code = 'OBE' AND type = 'EQUITY' LIMIT 1`,
        [a.ledger_id],
      )) as { id: string }[];
      const obeId = obeResult[0]?.id;
      if (!obeId) {
        continue;
      }
      const isDebitNormal = a.type === 'ASSETS' || a.type === 'EXPENSE';
      // Account side: positive OB on a debit-normal account → DEBIT; positive OB on a credit-normal account → CREDIT.
      const positive = a.opening_balance > 0;
      const accountDir = isDebitNormal === positive ? 'DEBIT' : 'CREDIT';
      const obeDir = accountDir === 'DEBIT' ? 'CREDIT' : 'DEBIT';
      const absAmount = Math.abs(a.opening_balance);

      // Date the OB transaction one day before the earliest existing transaction in the ledger,
      // or one year ago if the ledger has no other transactions. Keeps OBs out of "recent" feeds.
      const dateResult = (await queryRunner.query(
        `SELECT COALESCE(
           (SELECT MIN("transactionDate") - INTERVAL '1 day' FROM transactions WHERE ledger_id = $1),
           NOW() - INTERVAL '1 year'
         ) AS ob_date`,
        [a.ledger_id],
      )) as { ob_date: Date }[];
      const obDate = dateResult[0].ob_date;

      // At this point in the migration `transactionDate` is still camelCase (rename happens later).
      // `creditAmount`/`debitAmount` are still required columns until step 9 drops them — zero them out.
      const txResult = (await queryRunner.query(
        `INSERT INTO transactions (ledger_id, description, "transactionDate", posted_at, "creditAmount", "debitAmount")
         VALUES ($1, 'Opening balance', $2, $2, 0, 0)
         RETURNING id`,
        [a.ledger_id, obDate],
      )) as { id: string }[];
      const txId = txResult[0].id;
      await queryRunner.query(
        `INSERT INTO entries (transaction_id, account_id, direction, amount, currency, fx_rate, base_amount)
         VALUES ($1, $2, $3, $4, $5, 1, $4)`,
        [txId, a.id, accountDir, absAmount, a.currency],
      );
      // OBE entry uses the OBE account's currency (ledger base) — never the source account's
      // currency. For foreign-currency accounts the user will need to manually adjust the amount
      // to a properly FX-converted figure; Phase 6 (ExchangeRate cache) will eventually do this.
      const obeAccount = (await queryRunner.query(`SELECT currency FROM accounts WHERE id = $1`, [obeId])) as {
        currency: string;
      }[];
      const obeCurrency = obeAccount[0]?.currency ?? 'CHF';
      await queryRunner.query(
        `INSERT INTO entries (transaction_id, account_id, direction, amount, currency, fx_rate, base_amount)
         VALUES ($1, $2, $3, $4, $5, 1, $4)`,
        [txId, obeId, obeDir, absAmount, obeCurrency],
      );
    }

    // 8. Rename camelCase columns to snake_case and bump types where needed.
    await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "transactionDate" TO "transaction_date"`);
    await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "createdAt" TO "created_at"`);
    await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "updatedAt" TO "updated_at"`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "transaction_date" TYPE TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE`);

    // 9. Drop the old single-row columns on `transactions`.
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "draft"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "creditAccountId"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "debitAccountId"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "creditAmount"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "debitAmount"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "creditAccountAISuggested"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "debitAccountAISuggested"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "matchedTransactionId"`);

    // 10. Drop cache columns on `accounts` (balance derives from entries now).
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "openingBalance"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "debitBalance"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "creditBalance"`);

    // 11. FK constraints on entries.
    await queryRunner.query(
      `ALTER TABLE "entries" ADD CONSTRAINT "FK_f20cef059db69230f86e863b80a" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entries" ADD CONSTRAINT "FK_a401df6850c3d68be2791b44111" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore cache columns on accounts.
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "creditBalance" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "debitBalance" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "openingBalance" numeric(10,2) NOT NULL DEFAULT 0`);

    // Restore old transaction columns.
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "draft" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "creditAccountId" uuid`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "debitAccountId" uuid`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "creditAmount" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "debitAmount" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN "creditAccountAISuggested" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN "debitAccountAISuggested" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "matchedTransactionId" character varying`);

    // Reconstruct creditAccountId/debitAccountId/creditAmount/debitAmount from the entries.
    // Note: matches the swapped semantics used in up() — the legacy creditAccount* fields
    // were the DEBIT entry's data (account that gained value) and vice versa.
    await queryRunner.query(`
      UPDATE transactions tx
      SET "creditAccountId" = (SELECT account_id FROM entries WHERE transaction_id = tx.id AND direction = 'DEBIT'  LIMIT 1),
          "debitAccountId"  = (SELECT account_id FROM entries WHERE transaction_id = tx.id AND direction = 'CREDIT' LIMIT 1),
          "creditAmount"    = COALESCE((SELECT amount FROM entries WHERE transaction_id = tx.id AND direction = 'DEBIT'  LIMIT 1), 0),
          "debitAmount"     = COALESCE((SELECT amount FROM entries WHERE transaction_id = tx.id AND direction = 'CREDIT' LIMIT 1), 0),
          "draft"           = (tx.posted_at IS NULL),
          "userId"          = (
            SELECT om.user_id FROM ledgers l
            JOIN organizations o ON l.organization_id = o.id
            JOIN organization_memberships om ON om.organization_id = o.id
            WHERE l.id = tx.ledger_id AND o.kind = 'PERSONAL'
            LIMIT 1
          )
    `);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "userId" SET NOT NULL`);

    // Rename snake_case columns back to camelCase + revert type to timestamp.
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "transaction_date" TYPE TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "created_at" TYPE TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "updated_at" TYPE TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "transaction_date" TO "transactionDate"`);
    await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "created_at" TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "updated_at" TO "updatedAt"`);

    // Drop the new transaction columns.
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_de51b51eea51f759c29f557ff22"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_9fce29225a17afdfae8dd441ff6"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "reverses_transaction_id"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "posted_at"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "reference"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ledger_id"`);

    // Restore FKs.
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_f38ae5f1c4438d5a59639f9b41e" FOREIGN KEY ("creditAccountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_21f72e8648cfdda83b257a87fcc" FOREIGN KEY ("debitAccountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Drop entries table.
    await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_a401df6850c3d68be2791b44111"`);
    await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_f20cef059db69230f86e863b80a"`);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`DROP TYPE "public"."entries_direction_enum"`);
  }
}
