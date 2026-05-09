import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'don.privacy';

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  isPrivate = signal<boolean>(
    localStorage.getItem(STORAGE_KEY) === 'true',
  );

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, String(this.isPrivate()));
    });
  }

  toggle() {
    this.isPrivate.update((v) => !v);
  }
}
