import { AccountType } from '../../accounts/accounts.entity';
import { ChartDefinition } from './chart.types';

/**
 * Coded business chart loosely modelled on SKR-style ranges: 1xxx assets, 2xxx liabilities,
 * 3xxx equity, 4xxx revenue, 5xxx COGS, 6xxx operating expenses. Names are seeded in the user's
 * language; users can extend or rename freely after creation.
 */
export const BUSINESS_CHART: ChartDefinition = {
  groups: [
    {
      tag: 'current-assets',
      name: { en: 'Current Assets', de: 'Umlaufvermögen', fr: 'Actifs circulants', it: 'Attività correnti' },
      code: '1000',
    },
    {
      tag: 'fixed-assets',
      name: { en: 'Fixed Assets', de: 'Anlagevermögen', fr: 'Actifs immobilisés', it: 'Immobilizzazioni' },
      code: '1500',
    },
    {
      tag: 'liabilities',
      name: { en: 'Liabilities', de: 'Verbindlichkeiten', fr: 'Passifs', it: 'Passività' },
      code: '2000',
    },
    {
      tag: 'equity',
      name: { en: 'Equity', de: 'Eigenkapital', fr: 'Capitaux propres', it: 'Patrimonio netto' },
      code: '3000',
    },
    { tag: 'revenue', name: { en: 'Revenue', de: 'Erträge', fr: 'Produits', it: 'Ricavi' }, code: '4000' },
    {
      tag: 'cogs',
      name: { en: 'Cost of Goods Sold', de: 'Wareneinsatz', fr: 'Coût des marchandises vendues', it: 'Costo del venduto' },
      code: '5000',
    },
    {
      tag: 'operating-expenses',
      name: { en: 'Operating Expenses', de: 'Betriebsaufwand', fr: "Charges d'exploitation", it: 'Costi operativi' },
      code: '6000',
    },
  ],
  accounts: [
    { name: { en: 'Cash', de: 'Kasse', fr: 'Caisse', it: 'Cassa' }, type: AccountType.ASSETS, code: '1010', groupTag: 'current-assets' },
    { name: { en: 'Bank Account', de: 'Bank', fr: 'Compte bancaire', it: 'Conto bancario' }, type: AccountType.ASSETS, code: '1020', groupTag: 'current-assets' },
    {
      name: { en: 'Accounts Receivable', de: 'Forderungen', fr: 'Créances clients', it: 'Crediti verso clienti' },
      type: AccountType.ASSETS,
      code: '1100',
      groupTag: 'current-assets',
    },
    { name: { en: 'Equipment', de: 'Anlagen und Einrichtungen', fr: 'Équipement', it: 'Attrezzature' }, type: AccountType.ASSETS, code: '1500', groupTag: 'fixed-assets' },
    {
      name: { en: 'Accounts Payable', de: 'Verbindlichkeiten aus L+L', fr: 'Dettes fournisseurs', it: 'Debiti verso fornitori' },
      type: AccountType.LIABILITIES,
      code: '2000',
      groupTag: 'liabilities',
    },
    { name: { en: 'Sales Tax Payable', de: 'Umsatzsteuer', fr: 'TVA à payer', it: 'IVA a debito' }, type: AccountType.LIABILITIES, code: '2100', groupTag: 'liabilities' },
    {
      name: { en: 'Opening Balance', de: 'Eröffnungsbilanz', fr: "Solde d'ouverture", it: 'Saldo di apertura' },
      type: AccountType.EQUITY,
      code: '3000',
      groupTag: 'equity',
    },
    {
      name: { en: 'Retained Earnings', de: 'Gewinnvortrag', fr: 'Report à nouveau', it: 'Utili portati a nuovo' },
      type: AccountType.EQUITY,
      code: '3500',
      groupTag: 'equity',
      retainedEarnings: true,
    },
    { name: { en: 'Sales Revenue', de: 'Umsatzerlöse', fr: 'Ventes', it: 'Ricavi delle vendite' }, type: AccountType.INCOME, code: '4000', groupTag: 'revenue' },
    { name: { en: 'Service Revenue', de: 'Dienstleistungserträge', fr: 'Produits des services', it: 'Ricavi per servizi' }, type: AccountType.INCOME, code: '4100', groupTag: 'revenue' },
    {
      name: { en: 'Cost of Goods Sold', de: 'Wareneinsatz', fr: 'Coût des marchandises vendues', it: 'Costo del venduto' },
      type: AccountType.EXPENSE,
      code: '5000',
      groupTag: 'cogs',
    },
    { name: { en: 'Salaries', de: 'Personalaufwand', fr: 'Salaires', it: 'Stipendi' }, type: AccountType.EXPENSE, code: '6000', groupTag: 'operating-expenses' },
    { name: { en: 'Rent', de: 'Mietaufwand', fr: 'Loyer', it: 'Affitto' }, type: AccountType.EXPENSE, code: '6100', groupTag: 'operating-expenses' },
    { name: { en: 'Utilities', de: 'Nebenkosten', fr: 'Charges', it: 'Utenze' }, type: AccountType.EXPENSE, code: '6200', groupTag: 'operating-expenses' },
    {
      name: { en: 'Office Supplies', de: 'Bürobedarf', fr: 'Fournitures de bureau', it: "Forniture d'ufficio" },
      type: AccountType.EXPENSE,
      code: '6300',
      groupTag: 'operating-expenses',
    },
  ],
};
