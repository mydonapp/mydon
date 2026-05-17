import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Two small data fixes for the opening-balance journal entries created by the previous migration:
 *
 * 1. Backdate OB transactions. They were inserted with `NOW()` for `transaction_date`, which makes
 *    them appear in the user's "recent transactions" feed today. Move each OB transaction to the
 *    day before the earliest non-OB transaction in its ledger (so the OB is genuinely the first
 *    entry in the ledger's history). When a ledger has no other transactions, fall back to one
 *    year ago from today.
 *
 * 2. Fix the currency on the OBE-side entry. Previously the entry against the OBE account inherited
 *    the *source* account's currency (e.g. KRW for a KRW-denominated account), causing the dashboard
 *    to render it as the OBE account's currency (CHF). Set the OBE entry's currency to match the
 *    OBE account itself (the ledger's base currency). The numeric amount is left as-is — for
 *    foreign-currency accounts the user can manually adjust the OB transaction afterwards with a
 *    proper FX-converted amount; Phase 6 (ExchangeRate cache) will eventually automate this.
 */
export class FixOpeningBalanceDatesAndCurrency1779012309523 implements MigrationInterface {
  name = 'FixOpeningBalanceDatesAndCurrency1779012309523';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Backdate OB transactions per ledger.
    await queryRunner.query(`
      WITH ob_txs AS (
        SELECT id, ledger_id FROM transactions WHERE description = 'Opening balance'
      ),
      earliest_other AS (
        SELECT t.ledger_id, MIN(t.transaction_date) AS first_real_date
        FROM transactions t
        WHERE t.description <> 'Opening balance'
        GROUP BY t.ledger_id
      )
      UPDATE transactions tx
      SET transaction_date = COALESCE(
            (SELECT first_real_date - INTERVAL '1 day'
             FROM earliest_other eo WHERE eo.ledger_id = tx.ledger_id),
            NOW() - INTERVAL '1 year'
          ),
          posted_at = COALESCE(
            (SELECT first_real_date - INTERVAL '1 day'
             FROM earliest_other eo WHERE eo.ledger_id = tx.ledger_id),
            NOW() - INTERVAL '1 year'
          )
      WHERE tx.id IN (SELECT id FROM ob_txs)
    `);

    // 2. Fix OBE-side entries to use the OBE account's currency.
    await queryRunner.query(`
      UPDATE entries e
      SET currency = a.currency::text
      FROM accounts a
      WHERE e.account_id = a.id
        AND a.code = 'OBE'
        AND a.type = 'EQUITY'
        AND e.currency <> a.currency::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is a pure data fix. The down path can't recover the original values
    // (it would need to know each account's original currency and re-derive a "today" timestamp).
    // No-op: re-running up() is safe and idempotent.
  }
}
