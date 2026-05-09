import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  collapsed = signal(localStorage.getItem('sidebar') === 'collapsed');

  toggle() {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded');
  }
}
