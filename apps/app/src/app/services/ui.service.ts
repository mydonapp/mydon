import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {
  compactMode = signal(localStorage.getItem('ui.compactMode') === 'true');

  toggleCompactMode() {
    const next = !this.compactMode();
    this.compactMode.set(next);
    localStorage.setItem('ui.compactMode', String(next));
  }
}
