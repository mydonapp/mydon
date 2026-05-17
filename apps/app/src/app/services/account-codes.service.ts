import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mydon:showAccountCodes';

@Injectable({ providedIn: 'root' })
export class AccountCodesService {
  readonly show = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');

  setFromBackend(value: boolean): void {
    this.show.set(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  toggle() {
    const next = !this.show();
    this.show.set(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }
}
