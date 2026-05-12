import { Injectable, signal } from '@angular/core';

export type ListStyle = 'normal' | 'compact';

const STORAGE_KEY = 'mydon:listStyle';

@Injectable({ providedIn: 'root' })
export class ListStyleService {
  readonly listStyle = signal<ListStyle>(
    (localStorage.getItem(STORAGE_KEY) as ListStyle | null) ?? 'normal',
  );

  set(style: ListStyle) {
    this.listStyle.set(style);
    localStorage.setItem(STORAGE_KEY, style);
  }
}
