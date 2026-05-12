import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'don.privacy';

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  isPrivate = signal<boolean>(
    localStorage.getItem(STORAGE_KEY) === 'true',
  );

  setFromBackend(value: boolean): void {
    this.isPrivate.set(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  toggle() {
    const next = !this.isPrivate();
    this.isPrivate.set(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }
}
