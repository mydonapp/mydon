import { Injectable, signal, effect, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'mydon:i18n';

export const AVAILABLE_LANGUAGES = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  currentLanguage = signal<string>(this.readSavedLanguage());

  constructor() {
    effect(() => {
      const lang = this.currentLanguage();
      localStorage.setItem(STORAGE_KEY, lang);
      this.translate.use(lang);
    });
  }

  private readSavedLanguage(): string {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return 'en';
    }
    try {
      const parsed = JSON.parse(stored);
      return typeof parsed === 'string' ? parsed : (parsed?.language ?? 'en');
    } catch {
      return stored;
    }
  }

  setLanguage(lang: string) {
    this.currentLanguage.set(lang);
  }

  getAvailableLanguages() {
    return Object.entries(AVAILABLE_LANGUAGES).map(([code, name]) => ({
      code,
      name,
    }));
  }
}
