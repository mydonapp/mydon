import { InjectionToken } from '@angular/core';
import { Signal } from '@angular/core';

export interface FieldRef {
  fieldId: string;
  hasError: Signal<boolean>;
}

export const FIELD_TOKEN = new InjectionToken<FieldRef>('FieldRef');
