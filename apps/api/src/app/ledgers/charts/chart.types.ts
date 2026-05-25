import { AccountType } from '../../accounts/accounts.entity';

/** A chart label in each supported UI language. `en` is the fallback for unknown languages. */
export interface LocalizedString {
  en: string;
  de: string;
  fr: string;
  it: string;
}

/** Pick the label for a language, falling back to English. */
export function localize(value: LocalizedString, language: string): string {
  return value[language as keyof LocalizedString] ?? value.en;
}

/** Group identifier used to link accounts and parents within a chart definition. Not persisted. */
export interface AccountGroupDef {
  tag: string;
  name: LocalizedString;
  code?: string;
  parentTag?: string;
}

export interface AccountDef {
  name: LocalizedString;
  type: AccountType;
  code?: string;
  groupTag?: string;
  /** Marks the account the seeder should wire up as Ledger.retainedEarningsAccountId. Exactly one per chart. */
  retainedEarnings?: boolean;
}

export interface ChartDefinition {
  groups: AccountGroupDef[];
  accounts: AccountDef[];
}
