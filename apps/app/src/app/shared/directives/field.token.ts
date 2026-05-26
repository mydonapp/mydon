import { InjectionToken } from '@angular/core';
import { Signal } from '@angular/core';

export interface FieldRef {
  fieldId: string;
  hasError: Signal<boolean>;
  required: Signal<boolean>;
  /** Element id the control should point `aria-describedby` at (error text, else help text). */
  describedById: Signal<string | null>;
}

export const FIELD_TOKEN = new InjectionToken<FieldRef>('FieldRef');
