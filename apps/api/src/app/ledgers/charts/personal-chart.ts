import { AccountType } from '../../accounts/accounts.entity';
import { ChartDefinition } from './chart.types';

/**
 * Compact personal chart: flat groups, no codes. Aimed at someone tracking household finances
 * with one bank account and a handful of expense buckets. Names are seeded in the user's language.
 */
export const PERSONAL_CHART: ChartDefinition = {
  groups: [
    { tag: 'banking', name: { en: 'Banking', de: 'Bankkonten', fr: 'Banque', it: 'Banca' } },
    { tag: 'income', name: { en: 'Income', de: 'Einnahmen', fr: 'Revenus', it: 'Entrate' } },
    { tag: 'food', name: { en: 'Food', de: 'Lebensmittel', fr: 'Alimentation', it: 'Alimentari' } },
    { tag: 'housing', name: { en: 'Housing', de: 'Wohnen', fr: 'Logement', it: 'Abitazione' } },
    { tag: 'equity', name: { en: 'Equity', de: 'Eigenkapital', fr: 'Capitaux propres', it: 'Patrimonio netto' } },
  ],
  accounts: [
    { name: { en: 'Bank', de: 'Bank', fr: 'Banque', it: 'Banca' }, type: AccountType.ASSETS, groupTag: 'banking' },
    { name: { en: 'Income', de: 'Einkommen', fr: 'Revenu', it: 'Reddito' }, type: AccountType.INCOME, groupTag: 'income' },
    { name: { en: 'Food', de: 'Lebensmittel', fr: 'Alimentation', it: 'Alimentari' }, type: AccountType.EXPENSE, groupTag: 'food' },
    { name: { en: 'Rent', de: 'Miete', fr: 'Loyer', it: 'Affitto' }, type: AccountType.EXPENSE, groupTag: 'housing' },
    {
      name: { en: 'Opening Balance', de: 'Eröffnungsbilanz', fr: "Solde d'ouverture", it: 'Saldo di apertura' },
      type: AccountType.EQUITY,
      groupTag: 'equity',
    },
    {
      name: { en: 'Retained Earnings', de: 'Gewinnvortrag', fr: 'Report à nouveau', it: 'Utili portati a nuovo' },
      type: AccountType.EQUITY,
      groupTag: 'equity',
      retainedEarnings: true,
    },
  ],
};
