import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccountCodesService } from './account-codes.service';
import { AppConfigService } from './app-config.service';
import { LanguageService } from './language.service';
import { ListStyle, ListStyleService } from './list-style.service';
import { PrivacyService } from './privacy.service';
import { Theme, ThemeService } from './theme.service';

export interface User {
  id: string;
  name: string;
  email: string;
  language: string;
  theme: string;
  listStyle: string;
  privacyMode: boolean;
  showAccountCodes: boolean;
}

export interface UserPreferences {
  language?: string;
  theme?: string;
  listStyle?: string;
  privacyMode?: boolean;
  showAccountCodes?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly languageService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);
  private readonly listStyleService = inject(ListStyleService);
  private readonly privacyService = inject(PrivacyService);
  private readonly accountCodesService = inject(AccountCodesService);
  private readonly appConfig = inject(AppConfigService);

  user = signal<User | null>(null);
  private loaded = false;

  async fetchUser(force = false): Promise<void> {
    if (this.loaded && this.user() && !force) {
      return;
    }
    try {
      const user = await firstValueFrom(this.http.get<User>(`${this.appConfig.apiUrl}/v1/auth/me`));
      this.user.set(user);
      this.loaded = true;
      this.applyPreferences(user);
    } catch {
      this.user.set(null);
      this.loaded = false;
    }
  }

  private applyPreferences(user: User): void {
    this.languageService.setLanguage(user.language ?? 'en');
    this.themeService.setTheme((user.theme ?? 'system') as Theme);
    this.listStyleService.set((user.listStyle ?? 'normal') as ListStyle);
    this.privacyService.setFromBackend(user.privacyMode ?? false);
    this.accountCodesService.setFromBackend(user.showAccountCodes ?? false);
  }

  async updateUser(name: string, email: string): Promise<void> {
    const updated = await firstValueFrom(this.http.patch<User>(`${this.appConfig.apiUrl}/v1/auth/me`, { name, email }));
    this.user.set(updated);
  }

  async updatePreferences(prefs: UserPreferences): Promise<void> {
    const updated = await firstValueFrom(this.http.patch<User>(`${this.appConfig.apiUrl}/v1/auth/me`, prefs));
    this.user.set(updated);
    this.applyPreferences(updated);
  }

  clearCache(): void {
    this.loaded = false;
    this.user.set(null);
  }
}
