import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>((localStorage.getItem('theme') as Theme | null) ?? 'system');

  readonly theme = this._theme.asReadonly();

  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const t = this._theme();
    if (t !== 'system') {
      return t;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  constructor() {
    this.applyTheme(this._theme());
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    if (theme !== 'system') {
      html.classList.add(theme);
    }
  }
}
